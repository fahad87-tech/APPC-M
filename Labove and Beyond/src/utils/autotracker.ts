import { AutotrackConfig, AutotrackMatchResult, AutotrackTemplate, Point2D } from '../types/physics';

/**
 * Asynchronously seeks video to a target time and guarantees the new frame
 * is fully decoded and accessible to the 2D canvas before resolving.
 */
export function seekVideoFrame(video: HTMLVideoElement, targetTime: number): Promise<boolean> {
  return new Promise((resolve) => {
    if (Math.abs(video.currentTime - targetTime) < 0.0001) {
      resolve(true);
      return;
    }

    let timeoutId: any;
    const cleanup = () => {
      clearTimeout(timeoutId);
      video.removeEventListener('seeked', onSeeked);
    };

    const onSeeked = () => {
      cleanup();
      // Allow browser decoder pipeline to paint to surface
      if ('requestVideoFrameCallback' in video) {
        (video as any).requestVideoFrameCallback(() => resolve(true));
      } else {
        requestAnimationFrame(() => resolve(true));
      }
    };

    video.addEventListener('seeked', onSeeked, { once: true });
    timeoutId = setTimeout(() => {
      cleanup();
      resolve(false);
    }, 500);

    video.currentTime = targetTime;
  });
}

/**
 * Grabs template image data from a video element at a given pixel coordinate
 */
export function extractTemplate(
  video: HTMLVideoElement,
  center: Point2D,
  templateSize: number = 24
): AutotrackTemplate | null {
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth || 960;
  canvas.height = video.videoHeight || 540;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;

  try {
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  } catch (e) {
    console.error('Failed to capture video frame for autotrack', e);
    return null;
  }

  const half = Math.floor(templateSize / 2);
  const sx = Math.max(0, Math.min(canvas.width - templateSize, Math.round(center.x - half)));
  const sy = Math.max(0, Math.min(canvas.height - templateSize, Math.round(center.y - half)));

  const imageData = ctx.getImageData(sx, sy, templateSize, templateSize);
  return {
    imageData,
    width: templateSize,
    height: templateSize,
    centerPx: { x: center.x, y: center.y },
    frame: Math.round(video.currentTime * 30),
    time: video.currentTime,
  };
}

/**
 * Computes Multi-Channel Zero-mean Normalized Cross Correlation (ZNCC)
 * combining RGB chromatic channels and perceptual luminance for robust feature matching.
 */
function computeZNCC(
  templateData: Uint8ClampedArray,
  candidateData: Uint8ClampedArray,
  pixelCount: number
): number {
  let sumTluma = 0, sumCluma = 0;
  let sumTr = 0, sumCr = 0;
  let sumTg = 0, sumCg = 0;
  let sumTb = 0, sumCb = 0;

  const lumaT = new Float32Array(pixelCount);
  const lumaC = new Float32Array(pixelCount);

  for (let i = 0; i < pixelCount; i++) {
    const idx = i * 4;
    const tr = templateData[idx];
    const tg = templateData[idx + 1];
    const tb = templateData[idx + 2];

    const cr = candidateData[idx];
    const cg = candidateData[idx + 1];
    const cb = candidateData[idx + 2];

    const lt = 0.299 * tr + 0.587 * tg + 0.114 * tb;
    const lc = 0.299 * cr + 0.587 * cg + 0.114 * cb;

    lumaT[i] = lt;
    lumaC[i] = lc;

    sumTluma += lt; sumCluma += lc;
    sumTr += tr; sumCr += cr;
    sumTg += tg; sumCg += cg;
    sumTb += tb; sumCb += cb;
  }

  const meanTluma = sumTluma / pixelCount;
  const meanCluma = sumCluma / pixelCount;

  let numLuma = 0, denTluma = 0, denCluma = 0;
  let numR = 0, denTr = 0, denCr = 0;
  let numG = 0, denTg = 0, denCg = 0;
  let numB = 0, denTb = 0, denCb = 0;

  const meanTr = sumTr / pixelCount, meanCr = sumCr / pixelCount;
  const meanTg = sumTg / pixelCount, meanCg = sumCg / pixelCount;
  const meanTb = sumTb / pixelCount, meanCb = sumCb / pixelCount;

  for (let i = 0; i < pixelCount; i++) {
    const idx = i * 4;
    const dlt = lumaT[i] - meanTluma;
    const dlc = lumaC[i] - meanCluma;
    numLuma += dlt * dlc;
    denTluma += dlt * dlt;
    denCluma += dlc * dlc;

    const dtr = templateData[idx] - meanTr;
    const dcr = candidateData[idx] - meanCr;
    numR += dtr * dcr;
    denTr += dtr * dtr;
    denCr += dcr * dcr;

    const dtg = templateData[idx + 1] - meanTg;
    const dcg = candidateData[idx + 1] - meanCg;
    numG += dtg * dcg;
    denTg += dtg * dtg;
    denCg += dcg * dcg;

    const dtb = templateData[idx + 2] - meanTb;
    const dcb = candidateData[idx + 2] - meanCb;
    numB += dtb * dcb;
    denTb += dtb * dtb;
    denCb += dcb * dcb;
  }

  const dLuma = Math.sqrt(denTluma * denCluma);
  const scoreLuma = dLuma > 1e-6 ? numLuma / dLuma : 0;

  const dR = Math.sqrt(denTr * denCr);
  const dG = Math.sqrt(denTg * denCg);
  const dB = Math.sqrt(denTb * denCb);

  const scoreR = dR > 1e-6 ? numR / dR : scoreLuma;
  const scoreG = dG > 1e-6 ? numG / dG : scoreLuma;
  const scoreB = dB > 1e-6 ? numB / dB : scoreLuma;

  const scoreColor = (scoreR + scoreG + scoreB) / 3;

  // Blended match score (65% color-channels, 35% perceptual luminance)
  return Math.max(-1, Math.min(1, 0.65 * scoreColor + 0.35 * scoreLuma));
}

// Reusable offscreen canvas cache to prevent garbage collection frame drops
let cachedCanvas: HTMLCanvasElement | null = null;
let cachedCtx: CanvasRenderingContext2D | null = null;

function getOffscreenCanvas(width: number, height: number): CanvasRenderingContext2D | null {
  if (!cachedCanvas) {
    cachedCanvas = document.createElement('canvas');
  }
  if (cachedCanvas.width !== width || cachedCanvas.height !== height) {
    cachedCanvas.width = width;
    cachedCanvas.height = height;
    cachedCtx = null;
  }
  if (!cachedCtx) {
    cachedCtx = cachedCanvas.getContext('2d', { willReadFrequently: true });
  }
  return cachedCtx;
}

/**
 * Searches the current video frame for the template within searchRadius of lastPosition,
 * using sub-pixel parabolic peak interpolation for silky smooth kinematics curves.
 */
export function matchTemplate(
  video: HTMLVideoElement,
  template: AutotrackTemplate,
  predictedCenter: Point2D,
  config: AutotrackConfig
): AutotrackMatchResult {
  const vWidth = video.videoWidth || 960;
  const vHeight = video.videoHeight || 540;

  const ctx = getOffscreenCanvas(vWidth, vHeight);

  const failResult: AutotrackMatchResult = {
    found: false,
    bestPoint: predictedCenter,
    score: 0,
    searchWindow: {
      x: predictedCenter.x - config.searchRadius,
      y: predictedCenter.y - config.searchRadius,
      width: config.searchRadius * 2,
      height: config.searchRadius * 2,
    },
  };

  if (!ctx) return failResult;

  try {
    ctx.drawImage(video, 0, 0, vWidth, vHeight);
  } catch {
    return failResult;
  }

  const tW = template.width;
  const tH = template.height;
  const halfTW = Math.floor(tW / 2);
  const halfTH = Math.floor(tH / 2);
  const tPixels = tW * tH;
  const templateData = template.imageData.data;

  const searchRadius = Math.max(20, config.searchRadius);
  const startX = Math.max(halfTW, Math.min(vWidth - halfTW - 1, Math.round(predictedCenter.x - searchRadius)));
  const endX = Math.max(halfTW, Math.min(vWidth - halfTW - 1, Math.round(predictedCenter.x + searchRadius)));
  const startY = Math.max(halfTH, Math.min(vHeight - halfTH - 1, Math.round(predictedCenter.y - searchRadius)));
  const endY = Math.max(halfTH, Math.min(vHeight - halfTH - 1, Math.round(predictedCenter.y + searchRadius)));

  const searchWindowW = Math.max(1, endX - startX + tW);
  const searchWindowH = Math.max(1, endY - startY + tH);
  const searchAreaImage = ctx.getImageData(startX - halfTW, startY - halfTH, searchWindowW, searchWindowH);
  const searchData = searchAreaImage.data;

  let maxScore = -1;
  let bestX = Math.round(predictedCenter.x);
  let bestY = Math.round(predictedCenter.y);

  // Candidate buffer
  const candidateBuf = new Uint8ClampedArray(tPixels * 4);

  // Score sampling helper for candidate position
  const evalScoreAt = (cx: number, cy: number): number => {
    const relX = cx - startX;
    const relY = cy - startY;
    if (relX < 0 || relY < 0 || relX + tW > searchWindowW || relY + tH > searchWindowH) return -1;

    for (let row = 0; row < tH; row++) {
      const srcRowOffset = ((relY + row) * searchWindowW + relX) * 4;
      const dstRowOffset = row * tW * 4;
      for (let col = 0; col < tW * 4; col++) {
        candidateBuf[dstRowOffset + col] = searchData[srcRowOffset + col];
      }
    }
    return computeZNCC(templateData, candidateBuf, tPixels);
  };

  // Coarse-to-fine step progression
  const step = searchRadius > 45 ? 2 : 1;

  for (let cy = startY; cy <= endY; cy += step) {
    for (let cx = startX; cx <= endX; cx += step) {
      const score = evalScoreAt(cx, cy);
      if (score > maxScore) {
        maxScore = score;
        bestX = cx;
        bestY = cy;
      }
    }
  }

  // Fine 1px refinement around coarse peak if coarse step was used
  if (step > 1) {
    const fineStartX = Math.max(startX, bestX - step);
    const fineEndX = Math.min(endX, bestX + step);
    const fineStartY = Math.max(startY, bestY - step);
    const fineEndY = Math.min(endY, bestY + step);

    for (let cy = fineStartY; cy <= fineEndY; cy += 1) {
      for (let cx = fineStartX; cx <= fineEndX; cx += 1) {
        if (cx === bestX && cy === bestY) continue;
        const score = evalScoreAt(cx, cy);
        if (score > maxScore) {
          maxScore = score;
          bestX = cx;
          bestY = cy;
        }
      }
    }
  }

  // Sub-pixel parabolic peak interpolation around best integer match
  let subPixelX = bestX;
  let subPixelY = bestY;

  if (maxScore > 0.40) {
    const s0 = maxScore;
    const sLeft = evalScoreAt(bestX - 1, bestY);
    const sRight = evalScoreAt(bestX + 1, bestY);
    const sUp = evalScoreAt(bestX, bestY - 1);
    const sDown = evalScoreAt(bestX, bestY + 1);

    const denomX = 2 * (sLeft - 2 * s0 + sRight);
    let dx = 0;
    if (Math.abs(denomX) > 1e-4) {
      dx = (sLeft - sRight) / denomX;
      dx = Math.max(-0.5, Math.min(0.5, dx));
    }

    const denomY = 2 * (sUp - 2 * s0 + sDown);
    let dy = 0;
    if (Math.abs(denomY) > 1e-4) {
      dy = (sUp - sDown) / denomY;
      dy = Math.max(-0.5, Math.min(0.5, dy));
    }

    subPixelX = Number((bestX + dx).toFixed(2));
    subPixelY = Number((bestY + dy).toFixed(2));
  }

  // Evolutionary template update: blend slowly only on high-confidence matches (drift-protected)
  if (maxScore >= 0.72 && config.evolutionRate > 0) {
    const relX = bestX - startX;
    const relY = bestY - startY;
    const alpha = Math.min(0.10, config.evolutionRate); // Capped at 10% to prevent background drifting
    for (let row = 0; row < tH; row++) {
      const srcRowOffset = ((relY + row) * searchWindowW + relX) * 4;
      const dstRowOffset = row * tW * 4;
      for (let col = 0; col < tW * 4; col++) {
        templateData[dstRowOffset + col] = Math.round(
          (1 - alpha) * templateData[dstRowOffset + col] + alpha * searchData[srcRowOffset + col]
        );
      }
    }
  }

  const isFound = maxScore >= config.threshold;

  return {
    found: isFound,
    bestPoint: { x: subPixelX, y: subPixelY },
    score: Math.max(0, Number(maxScore.toFixed(3))),
    searchWindow: {
      x: startX - halfTW,
      y: startY - halfTH,
      width: searchWindowW,
      height: searchWindowH,
    },
  };
}

