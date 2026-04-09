#!/usr/bin/env python3
"""
Exam Pacing Timer — PyQt6 Edition
Modern dark theme with neon glows, glass-morphism cards, anti-aliased rendering,
radial gradients, drop shadows, and smooth 60 fps animation.
"""

import sys
import math
import time
from PyQt6.QtWidgets import (
    QApplication, QMainWindow, QWidget, QVBoxLayout, QHBoxLayout,
    QGridLayout, QLabel, QPushButton, QSpinBox, QCheckBox,
    QGraphicsDropShadowEffect, QFrame, QSizePolicy, QSpacerItem
)
from PyQt6.QtCore import Qt, QTimer, QRectF, QPointF
from PyQt6.QtGui import (
    QPainter, QColor, QFont, QLinearGradient, QRadialGradient,
    QPen, QBrush, QFontDatabase, QPainterPath, QConicalGradient,
    QPalette, QFontMetrics
)


# ──────────────────────────── Colour Helpers ────────────────────────────

def lerp_color(c1: QColor, c2: QColor, t: float) -> QColor:
    t = max(0.0, min(1.0, t))
    return QColor(
        int(c1.red()   + (c2.red()   - c1.red())   * t),
        int(c1.green() + (c2.green() - c1.green()) * t),
        int(c1.blue()  + (c2.blue()  - c1.blue())  * t),
        int(c1.alpha() + (c2.alpha() - c1.alpha()) * t),
    )


def urgency_color(fraction_elapsed: float) -> QColor:
    if fraction_elapsed < 0.5:
        return lerp_color(QColor("#00e676"), QColor("#ffeb3b"), fraction_elapsed / 0.5)
    elif fraction_elapsed < 0.8:
        return lerp_color(QColor("#ffeb3b"), QColor("#ff9800"), (fraction_elapsed - 0.5) / 0.3)
    else:
        return lerp_color(QColor("#ff9800"), QColor("#ff1744"), (fraction_elapsed - 0.8) / 0.2)


# ──────────────────────────── Section Data ────────────────────────────

class Section:
    def __init__(self, name: str, minutes: float, questions: int, color: str, accent: str):
        self.name = name
        self.total_seconds = int(minutes * 60)
        self.questions = questions
        self.color = QColor(color)
        self.accent = QColor(accent)
        self.elapsed = 0.0
        self.finished = False

        # ── Per-question budget ──
        # Fixed seconds each question gets (total_time / total_questions)
        if self.questions > 0:
            self.sec_per_question = self.total_seconds / self.questions
        else:
            self.sec_per_question = 0.0

        # Tracks elapsed time *within* the current question's budget window
        self.question_timer_elapsed = 0.0

    @property
    def remaining(self) -> float:
        return max(0.0, self.total_seconds - self.elapsed)

    @property
    def fraction(self) -> float:
        if self.total_seconds <= 0:
            return 1.0
        return min(1.0, self.elapsed / self.total_seconds)

    @property
    def current_question(self) -> int:
        if self.questions <= 0:
            return 0
        return min(self.questions, max(1, math.ceil(self.fraction * self.questions)))

    @property
    def remaining_questions(self) -> int:
        return max(0, self.questions - self.current_question)

    @property
    def question_time_remaining(self) -> float:
        """Countdown: how many seconds left in the current question's budget."""
        return max(0.0, self.sec_per_question - self.question_timer_elapsed)


# ──────────────────────────── Ring Timer Widget ────────────────────────

class RingTimerWidget(QWidget):
    """Large neon dual-ring countdown.
    Outer thin ring  = total exam progress  (white/dim)
    Inner thick ring = current section      (coloured, glowing)
    All text guaranteed to stay inside the inner ring.
    """

    def __init__(self, parent=None):
        super().__init__(parent)
        self.fraction = 0.0
        self.color = QColor("#00e676")
        self.section_text = "00:00"
        self.total_text = "00:00"
        self.section_name = ""
        self.total_fraction = 0.0
        self._pulse_phase = 0.0
        self.setMinimumSize(340, 340)

    def set_state(self, fraction: float, color: QColor, section_text: str,
                  total_text: str = "", section_name: str = "",
                  total_fraction: float = 0.0):
        self.fraction = fraction
        self.color = color
        self.section_text = section_text
        self.total_text = total_text
        self.section_name = section_name
        self.total_fraction = total_fraction
        self._pulse_phase += 0.08
        self.update()

    def paintEvent(self, event):
        p = QPainter(self)
        p.setRenderHint(QPainter.RenderHint.Antialiasing)
        p.setRenderHint(QPainter.RenderHint.TextAntialiasing)
        w, h = self.width(), self.height()
        side = min(w, h)
        cx, cy = w / 2, h / 2

        # ═══ OUTER RING — total exam ═══
        outer_r = side * 0.46
        outer_w = side * 0.02

        p.setPen(QPen(QColor(255, 255, 255, 12), outer_w,
                       Qt.PenStyle.SolidLine, Qt.PenCapStyle.RoundCap))
        outer_rect = QRectF(cx - outer_r, cy - outer_r, outer_r * 2, outer_r * 2)
        p.drawArc(outer_rect, 90 * 16, -360 * 16)

        total_remaining = max(0.0, 1.0 - self.total_fraction)
        total_span = int(-total_remaining * 360 * 16)
        for i in range(3):
            ga = max(2, 30 - i * 12)
            gw = outer_w + (i + 1) * 3
            gc = QColor(255, 255, 255, ga)
            p.setPen(QPen(gc, gw, Qt.PenStyle.SolidLine, Qt.PenCapStyle.RoundCap))
            p.drawArc(outer_rect, 90 * 16, total_span)
        p.setPen(QPen(QColor(255, 255, 255, 55), outer_w,
                       Qt.PenStyle.SolidLine, Qt.PenCapStyle.RoundCap))
        p.drawArc(outer_rect, 90 * 16, total_span)

        # ═══ INNER RING — section ═══
        inner_r = side * 0.38
        inner_w = side * 0.04

        p.setPen(QPen(QColor(255, 255, 255, 15), inner_w,
                       Qt.PenStyle.SolidLine, Qt.PenCapStyle.RoundCap))
        inner_rect = QRectF(cx - inner_r, cy - inner_r, inner_r * 2, inner_r * 2)
        p.drawArc(inner_rect, 90 * 16, -360 * 16)

        section_remaining = max(0.0, 1.0 - self.fraction)
        section_span = int(-section_remaining * 360 * 16)

        pulse = 1.0
        if self.fraction > 0.8:
            pulse = 1.0 + 0.15 * math.sin(self._pulse_phase)

        for i in range(5):
            glow_alpha = max(3, int((70 - i * 14) * pulse))
            glow_w = inner_w + (i + 1) * 5
            gc = QColor(self.color)
            gc.setAlpha(glow_alpha)
            p.setPen(QPen(gc, glow_w, Qt.PenStyle.SolidLine, Qt.PenCapStyle.RoundCap))
            p.drawArc(inner_rect, 90 * 16, section_span)

        p.setPen(QPen(self.color, inner_w, Qt.PenStyle.SolidLine, Qt.PenCapStyle.RoundCap))
        p.drawArc(inner_rect, 90 * 16, section_span)

        # Bright tip dot
        if section_remaining > 0.005:
            angle_rad = math.radians(90 - section_remaining * 360)
            dot_x = cx + inner_r * math.cos(angle_rad)
            dot_y = cy - inner_r * math.sin(angle_rad)
            dot_glow = QRadialGradient(dot_x, dot_y, inner_w * 2)
            dc = QColor(self.color)
            dc.setAlpha(180)
            dot_glow.setColorAt(0.0, QColor(255, 255, 255, 200))
            dot_glow.setColorAt(0.3, dc)
            dot_glow.setColorAt(1.0, QColor(0, 0, 0, 0))
            p.setBrush(QBrush(dot_glow))
            p.setPen(Qt.PenStyle.NoPen)
            p.drawEllipse(QPointF(dot_x, dot_y), inner_w * 2, inner_w * 2)

        # ═══ CENTRE TEXT — adaptive layout inside inner ring ═══
        safe_r = inner_r - inner_w - 8
        avail_h = safe_r * 2

        scale = 1.0

        def compute_layout(sc):
            fs = {
                # ── Section name font BIGGER (was 0.036, now 0.055) ──
                'name':      max(10, int(side * 0.055 * sc)),
                'sec_time':  max(16, int(side * 0.13  * sc)),
                'sec_pct':   max(8,  int(side * 0.038 * sc)),
                'tot_lbl':   max(7,  int(side * 0.032 * sc)),
                'tot_time':  max(12, int(side * 0.08  * sc)),
                'tot_pct':   max(8,  int(side * 0.036 * sc)),
            }
            gaps = {
                'g1': max(1, int(4 * sc)),
                'g2': max(1, int(3 * sc)),
                'g3': max(2, int(8 * sc)),
                'g4': max(2, int(5 * sc)),
                'g5': max(1, int(2 * sc)),
                'g6': max(1, int(3 * sc)),
            }
            div_h = max(4, int(8 * sc))

            def fh(sz, bold=False):
                f = QFont("Segoe UI", sz, QFont.Weight.Bold if bold else QFont.Weight.Normal)
                return QFontMetrics(f).height()

            total_h = (fh(fs['name'], True) + gaps['g1']
                       + fh(fs['sec_time'], True) + gaps['g2']
                       + fh(fs['sec_pct'], True) + gaps['g3']
                       + div_h + gaps['g4']
                       + fh(fs['tot_lbl'], True) + gaps['g5']
                       + fh(fs['tot_time'], True) + gaps['g6']
                       + fh(fs['tot_pct'], True))
            return total_h, fs, gaps, div_h

        total_h, fs, gaps, div_h = compute_layout(scale)
        while total_h > avail_h and scale > 0.5:
            scale -= 0.05
            total_h, fs, gaps, div_h = compute_layout(scale)

        def fh(sz, bold=False):
            f = QFont("Segoe UI", sz, QFont.Weight.Bold if bold else QFont.Weight.Normal)
            return QFontMetrics(f).height()

        y = cy - total_h / 2

        # 1. Section name — BIGGER and BOLDER
        h_name = fh(fs['name'], True)
        name_font = QFont("Segoe UI", fs['name'], QFont.Weight.ExtraBold)
        p.setFont(name_font)
        # Glow behind section name
        name_color = QColor(self.color)
        glow_c = QColor(name_color)
        glow_c.setAlpha(40)
        p.setPen(glow_c)
        p.drawText(QRectF(-1, y - 1, w + 2, h_name + 2),
                   Qt.AlignmentFlag.AlignCenter,
                   self.section_name.upper() if self.section_name else "")
        # Main text
        p.setPen(name_color)
        p.drawText(QRectF(0, y, w, h_name), Qt.AlignmentFlag.AlignCenter,
                    self.section_name.upper() if self.section_name else "")
        y += h_name + gaps['g1']

        # 2. Section time (BIG)
        h_st = fh(fs['sec_time'], True)
        p.setFont(QFont("Segoe UI", fs['sec_time'], QFont.Weight.Bold))
        p.setPen(QColor(0, 0, 0, 120))
        p.drawText(QRectF(2, y + 2, w, h_st), Qt.AlignmentFlag.AlignCenter, self.section_text)
        p.setPen(QColor(255, 255, 255, 250))
        p.drawText(QRectF(0, y, w, h_st), Qt.AlignmentFlag.AlignCenter, self.section_text)
        y += h_st + gaps['g2']

        # 3. Section %
        h_sp = fh(fs['sec_pct'], True)
        p.setFont(QFont("Segoe UI", fs['sec_pct'], QFont.Weight.Bold))
        sc_c = QColor(self.color)
        sc_c.setAlpha(210)
        p.setPen(sc_c)
        p.drawText(QRectF(0, y, w, h_sp), Qt.AlignmentFlag.AlignCenter,
                    f"{section_remaining * 100:.0f}% remaining")
        y += h_sp + gaps['g3']

        # 4. Divider
        div_half = side * 0.12
        div_cy = y + div_h / 2
        p.setPen(QPen(QColor(255, 255, 255, 45), 1.5))
        p.drawLine(QPointF(cx - div_half, div_cy), QPointF(cx + div_half, div_cy))
        y += div_h + gaps['g4']

        # 5. "TOTAL EXAM" label
        h_tl = fh(fs['tot_lbl'], True)
        p.setFont(QFont("Segoe UI", fs['tot_lbl'], QFont.Weight.Bold))
        p.setPen(QColor(255, 255, 255, 110))
        p.drawText(QRectF(0, y, w, h_tl), Qt.AlignmentFlag.AlignCenter, "TOTAL EXAM")
        y += h_tl + gaps['g5']

        # 6. Total time
        h_tt = fh(fs['tot_time'], True)
        p.setFont(QFont("Segoe UI", fs['tot_time'], QFont.Weight.Bold))
        p.setPen(QColor(0, 0, 0, 80))
        p.drawText(QRectF(1, y + 1, w, h_tt), Qt.AlignmentFlag.AlignCenter, self.total_text)
        p.setPen(QColor(255, 255, 255, 220))
        p.drawText(QRectF(0, y, w, h_tt), Qt.AlignmentFlag.AlignCenter, self.total_text)
        y += h_tt + gaps['g6']

        # 7. Total %
        h_tp = fh(fs['tot_pct'], True)
        p.setFont(QFont("Segoe UI", fs['tot_pct'], QFont.Weight.Bold))
        p.setPen(QColor(255, 255, 255, 130))
        pct_left = max(0.0, (1.0 - self.total_fraction)) * 100
        p.drawText(QRectF(0, y, w, h_tp), Qt.AlignmentFlag.AlignCenter,
                    f"{pct_left:.0f}% of exam left")

        p.end()


# ──────────────────────────── Progress Bar Widget ────────────────────

class GradientProgressBar(QWidget):
    def __init__(self, parent=None):
        super().__init__(parent)
        self.fraction = 0.0
        self.color = QColor("#00e676")
        self.setFixedHeight(26)

    def set_state(self, fraction: float, color: QColor):
        self.fraction = fraction
        self.color = color
        self.update()

    def paintEvent(self, event):
        p = QPainter(self)
        p.setRenderHint(QPainter.RenderHint.Antialiasing)
        w, h = self.width(), self.height()
        radius = h / 2

        p.setBrush(QColor(255, 255, 255, 12))
        p.setPen(Qt.PenStyle.NoPen)
        p.drawRoundedRect(QRectF(0, 0, w, h), radius, radius)

        fill_w = max(h, self.fraction * w)
        grad = QLinearGradient(0, 0, fill_w, 0)
        c1 = QColor(self.color); c1.setAlpha(180)
        c2 = QColor(self.color); c2.setAlpha(255)
        grad.setColorAt(0.0, c1)
        grad.setColorAt(1.0, c2)
        p.setBrush(QBrush(grad))
        p.drawRoundedRect(QRectF(0, 0, fill_w, h), radius, radius)

        if self.fraction > 0.01:
            glow_grad = QRadialGradient(fill_w, h / 2, h * 1.5)
            gc = QColor(self.color); gc.setAlpha(80)
            glow_grad.setColorAt(0.0, gc)
            glow_grad.setColorAt(1.0, QColor(0, 0, 0, 0))
            p.setBrush(QBrush(glow_grad))
            p.drawEllipse(QPointF(fill_w, h / 2), h * 1.5, h * 1.5)

        p.setPen(QColor(255, 255, 255, 200))
        p.setFont(QFont("Segoe UI", 9, QFont.Weight.Bold))
        p.drawText(QRectF(0, 0, w, h), Qt.AlignmentFlag.AlignCenter,
                    f"{self.fraction * 100:.0f}%")
        p.end()


# ──────────────────────────── Glass Card ────────────────────────────

class GlassCard(QFrame):
    def __init__(self, parent=None):
        super().__init__(parent)
        self.setStyleSheet("""
            GlassCard {
                background: rgba(255, 255, 255, 6);
                border: 1px solid rgba(255, 255, 255, 12);
                border-radius: 16px;
            }
        """)
        shadow = QGraphicsDropShadowEffect(self)
        shadow.setBlurRadius(30)
        shadow.setOffset(0, 4)
        shadow.setColor(QColor(0, 0, 0, 100))
        self.setGraphicsEffect(shadow)


# ──────────────────────────── Question Display Widget ────────────────

class QuestionDisplay(QWidget):
    def __init__(self, parent=None):
        super().__init__(parent)
        self.q_current = 0
        self.q_total = 0
        self.color = QColor("#00e676")
        self.setMinimumHeight(100)

    def set_state(self, current: int, total: int, color: QColor):
        self.q_current = current
        self.q_total = total
        self.color = color
        self.update()

    def paintEvent(self, event):
        p = QPainter(self)
        p.setRenderHint(QPainter.RenderHint.Antialiasing)
        p.setRenderHint(QPainter.RenderHint.TextAntialiasing)
        w, h = self.width(), self.height()
        margin = 16
        usable_w = w - margin * 2
        usable_h = h - margin * 2

        big_text = f"Q{self.q_current}"
        big_size = max(18, int(usable_h * 0.50))
        while big_size > 18:
            test_font = QFont("Segoe UI", big_size, QFont.Weight.Bold)
            p.setFont(test_font)
            if p.fontMetrics().horizontalAdvance(big_text) <= usable_w * 0.90:
                break
            big_size -= 2

        big_font = QFont("Segoe UI", big_size, QFont.Weight.Bold)
        p.setFont(big_font)
        big_height = p.fontMetrics().height()

        small_size = max(11, int(big_size * 0.30))
        small_font = QFont("Segoe UI", small_size)
        p.setFont(small_font)
        small_text = f"out of {self.q_total}"
        small_height = p.fontMetrics().height()

        line_gap = 6
        total_text_h = big_height + line_gap + small_height
        top_y = margin + (usable_h - total_text_h) / 2

        big_rect = QRectF(margin, top_y, usable_w, big_height)
        small_rect = QRectF(margin, top_y + big_height + line_gap, usable_w, small_height)

        glow_cx, glow_cy = w / 2, top_y + big_height * 0.5
        glow_r = big_height * 0.9
        glow_c = QColor(self.color); glow_c.setAlpha(30)
        glow = QRadialGradient(glow_cx, glow_cy, glow_r)
        glow.setColorAt(0.0, glow_c)
        glow.setColorAt(1.0, QColor(0, 0, 0, 0))
        p.setBrush(QBrush(glow))
        p.setPen(Qt.PenStyle.NoPen)
        p.drawEllipse(QPointF(glow_cx, glow_cy), glow_r, glow_r)

        p.setFont(big_font)
        p.setPen(QColor(0, 0, 0, 90))
        p.drawText(big_rect.adjusted(2, 2, 2, 2), Qt.AlignmentFlag.AlignCenter, big_text)
        p.setPen(self.color)
        p.drawText(big_rect, Qt.AlignmentFlag.AlignCenter, big_text)

        p.setFont(small_font)
        p.setPen(QColor(255, 255, 255, 150))
        p.drawText(small_rect, Qt.AlignmentFlag.AlignCenter, small_text)
        p.end()


# ──────────────────────────── Section Overview Bar ────────────────────

class OverviewBar(QWidget):
    def __init__(self, parent=None):
        super().__init__(parent)
        self.sections: list[Section] = []
        self.current_idx = -1
        self.setFixedHeight(38)

    def set_state(self, sections: list, idx: int):
        self.sections = sections
        self.current_idx = idx
        self.update()

    def paintEvent(self, event):
        if not self.sections:
            return
        p = QPainter(self)
        p.setRenderHint(QPainter.RenderHint.Antialiasing)
        w, h = self.width(), self.height()
        total_time = sum(s.total_seconds for s in self.sections)
        if total_time <= 0:
            p.end(); return

        x = 0.0; gap = 4
        for i, sec in enumerate(self.sections):
            seg_w = max(30, (sec.total_seconds / total_time) * (w - gap * (len(self.sections) - 1)))
            rect = QRectF(x, 0, seg_w, h)

            color = QColor(sec.color)
            if sec.finished:
                color.setAlpha(40)
            elif i == self.current_idx:
                color.setAlpha(200)
            else:
                color.setAlpha(60)

            p.setBrush(color); p.setPen(Qt.PenStyle.NoPen)
            p.drawRoundedRect(rect, 8, 8)

            if i == self.current_idx and not sec.finished:
                fill_rect = QRectF(x, 0, seg_w * sec.fraction, h)
                fc = QColor(sec.accent); fc.setAlpha(90)
                p.setBrush(fc)
                p.drawRoundedRect(fill_rect, 8, 8)

            if i == self.current_idx:
                p.setPen(QPen(QColor(255, 255, 255, 60), 1.5))
                p.setBrush(Qt.BrushStyle.NoBrush)
                p.drawRoundedRect(rect.adjusted(1, 1, -1, -1), 7, 7)

            p.setPen(QColor(255, 255, 255, 210 if i == self.current_idx else 90))
            p.setFont(QFont("Segoe UI", 10, QFont.Weight.Bold))
            p.drawText(rect, Qt.AlignmentFlag.AlignCenter, sec.name)
            x += seg_w + gap
        p.end()


# ──────────────────────────── Info Card Widget ────────────────────────

class InfoCard(GlassCard):
    def __init__(self, label_text: str, parent=None):
        super().__init__(parent)
        layout = QVBoxLayout(self)
        layout.setContentsMargins(14, 12, 14, 12)
        layout.setSpacing(6)

        self.label = QLabel(label_text)
        self.label.setFont(QFont("Segoe UI", 14, QFont.Weight.Bold))
        self.label.setStyleSheet("color: rgba(255,255,255,200); background: transparent; border: none;")
        self.label.setAlignment(Qt.AlignmentFlag.AlignCenter)

        self.value_label = QLabel("—")
        self.value_label.setFont(QFont("Segoe UI", 28, QFont.Weight.Bold))
        self.value_label.setStyleSheet("color: #ffffff; background: transparent; border: none;")
        self.value_label.setAlignment(Qt.AlignmentFlag.AlignCenter)

        layout.addWidget(self.label)
        layout.addWidget(self.value_label)

    def set_value(self, text: str, color: str = "#ffffff"):
        self.value_label.setText(text)
        self.value_label.setStyleSheet(f"color: {color}; background: transparent; border: none;")


# ──────────────────────────── Pause Overlay ────────────────────────────

class PauseOverlay(QWidget):
    def __init__(self, parent=None):
        super().__init__(parent)
        self.setAttribute(Qt.WidgetAttribute.WA_TransparentForMouseEvents, False)
        self.hide()

    def paintEvent(self, event):
        p = QPainter(self)
        p.setRenderHint(QPainter.RenderHint.Antialiasing)
        w, h = self.width(), self.height()
        p.fillRect(0, 0, w, h, QColor(0, 0, 0, 160))

        bar_w, bar_h, gap = 18, 60, 16
        cx, cy = w / 2, h / 2

        p.setPen(Qt.PenStyle.NoPen)
        glow = QRadialGradient(cx, cy, 80)
        glow.setColorAt(0.0, QColor(255, 193, 7, 50))
        glow.setColorAt(1.0, QColor(0, 0, 0, 0))
        p.setBrush(QBrush(glow))
        p.drawEllipse(QPointF(cx, cy), 80, 80)

        p.setBrush(QColor("#ffc107"))
        p.drawRoundedRect(QRectF(cx - gap / 2 - bar_w, cy - bar_h / 2, bar_w, bar_h), 4, 4)
        p.drawRoundedRect(QRectF(cx + gap / 2, cy - bar_h / 2, bar_w, bar_h), 4, 4)

        p.setFont(QFont("Segoe UI", 16, QFont.Weight.Bold))
        p.setPen(QColor("#ffc107"))
        p.drawText(QRectF(0, cy + bar_h / 2 + 10, w, 40),
                    Qt.AlignmentFlag.AlignCenter, "PAUSED")
        p.end()


# ──────────────────────────── Main Window ────────────────────────────

class ExamTimerWindow(QMainWindow):

    BG = "#0a0e1a"

    def __init__(self):
        super().__init__()
        self.setWindowTitle("Exam Pacing Timer")
        self.setMinimumSize(1200, 800)
        self.setStyleSheet(f"""
            QMainWindow {{ background: {self.BG}; }}
            QWidget {{ background: transparent; color: #e0e0e0; }}
            QLabel {{ color: #e0e0e0; }}
            QSpinBox {{
                background: rgba(255,255,255,8);
                border: 1px solid rgba(255,255,255,18);
                border-radius: 8px; padding: 6px 12px;
                color: #ffffff; font-family: "Segoe UI"; font-size: 14px; min-width: 80px;
            }}
            QSpinBox:focus {{ border: 1px solid rgba(100,180,255,80); }}
            QSpinBox::up-button, QSpinBox::down-button {{
                width: 20px; border: none;
                background: rgba(255,255,255,10); border-radius: 4px;
            }}
            QSpinBox::up-button:hover, QSpinBox::down-button:hover {{
                background: rgba(255,255,255,20);
            }}
            QCheckBox {{
                color: #b0b0b0; font-family: "Segoe UI"; font-size: 13px; spacing: 8px;
            }}
            QCheckBox::indicator {{
                width: 18px; height: 18px; border-radius: 4px;
                border: 2px solid rgba(255,255,255,25); background: rgba(255,255,255,6);
            }}
            QCheckBox::indicator:checked {{ background: #7c4dff; border-color: #7c4dff; }}
        """)

        self.sections: list[Section] = []
        self.current_section_idx = -1
        self.running = False
        self.paused = False
        self.last_tick = 0.0
        self.waiting_for_frq = False
        self.slow_motion = False
        self.slow_factor = 0.25

        # Track which question number we last displayed, so we know when it changes
        self._last_question_num = -1

        self._build_ui()

        self.pause_overlay = PauseOverlay(self.centralWidget())
        self.pause_overlay.hide()

        self.timer = QTimer(self)
        self.timer.timeout.connect(self._tick)
        self.timer.setInterval(16)

    def resizeEvent(self, event):
        super().resizeEvent(event)
        if hasattr(self, 'pause_overlay'):
            self.pause_overlay.setGeometry(self.centralWidget().rect())

    def _build_ui(self):
        central = QWidget()
        self.setCentralWidget(central)
        root = QVBoxLayout(central)
        root.setContentsMargins(24, 18, 24, 18)
        root.setSpacing(14)

        # Title
        title = QLabel("EXAM  PACING  TIMER")
        title.setFont(QFont("Segoe UI", 20, QFont.Weight.Bold))
        title.setStyleSheet("color: rgba(255,255,255,180); letter-spacing: 6px;")
        title.setAlignment(Qt.AlignmentFlag.AlignCenter)
        root.addWidget(title)

        # Settings row
        settings_card = GlassCard()
        sl = QHBoxLayout(settings_card)
        sl.setContentsMargins(20, 14, 20, 14)
        sl.setSpacing(24)

        mcq_group = self._make_input_group("MCQ", "#42a5f5", "#90caf9", 40, 45)
        sl.addLayout(mcq_group["layout"])
        sl.addWidget(self._vdivider())

        frq_group = self._make_input_group("FRQ", "#ab47bc", "#ce93d8", 5, 35)
        sl.addLayout(frq_group["layout"])
        sl.addWidget(self._vdivider())

        opt_layout = QVBoxLayout()
        opt_layout.setSpacing(8)
        opt_label = QLabel("Options")
        opt_label.setFont(QFont("Segoe UI", 12, QFont.Weight.Bold))
        opt_label.setStyleSheet("color: rgba(255,255,255,130);")
        opt_layout.addWidget(opt_label)

        self.break_cb = QCheckBox("Break between MCQ & FRQ")
        self.break_cb.setChecked(False)
        opt_layout.addWidget(self.break_cb)

        self.slow_cb = QCheckBox("Slow-motion (0.25× speed)")
        self.slow_cb.setChecked(False)
        self.slow_cb.toggled.connect(lambda c: setattr(self, 'slow_motion', c))
        opt_layout.addWidget(self.slow_cb)
        opt_layout.addStretch()
        sl.addLayout(opt_layout)

        self.mcq_inputs = mcq_group
        self.frq_inputs = frq_group
        root.addWidget(settings_card)

        # Buttons
        btn_row = QHBoxLayout()
        btn_row.setSpacing(10)

        self.start_btn = self._make_button("▶  START", "#1b5e20", "#2e7d32")
        self.start_btn.clicked.connect(self._on_start)
        btn_row.addWidget(self.start_btn)

        self.pause_btn = self._make_button("⏸  PAUSE", "#e65100", "#f57c00")
        self.pause_btn.clicked.connect(self._on_pause)
        self.pause_btn.setEnabled(False)
        btn_row.addWidget(self.pause_btn)

        self.reset_btn = self._make_button("↺  RESET", "#b71c1c", "#d32f2f")
        self.reset_btn.clicked.connect(self._on_reset)
        btn_row.addWidget(self.reset_btn)

        self.frq_start_btn = self._make_button("▶  START FRQ", "#6a1b9a", "#8e24aa")
        self.frq_start_btn.clicked.connect(self._on_start_frq)
        self.frq_start_btn.setVisible(False)
        btn_row.addWidget(self.frq_start_btn)
        root.addLayout(btn_row)

        # Middle — ring + question + info
        mid = QHBoxLayout()
        mid.setSpacing(18)

        self.ring = RingTimerWidget()
        mid.addWidget(self.ring, stretch=4)

        q_card = GlassCard()
        q_inner = QVBoxLayout(q_card)
        q_inner.setContentsMargins(10, 8, 10, 8)
        q_inner.setSpacing(4)

        self.section_label = QLabel("—")
        self.section_label.setFont(QFont("Segoe UI", 13, QFont.Weight.Bold))
        self.section_label.setStyleSheet("color: rgba(255,255,255,130); background: transparent; border: none;")
        self.section_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        q_inner.addWidget(self.section_label)

        self.question_display = QuestionDisplay()
        q_inner.addWidget(self.question_display, stretch=1)
        mid.addWidget(q_card, stretch=3)

        info_col = QVBoxLayout()
        info_col.setSpacing(8)
        self.card_remaining_q = InfoCard("Questions Left")
        self.card_time_per_q = InfoCard("Sec / Question")
        self.card_elapsed = InfoCard("Elapsed Time")
        info_col.addWidget(self.card_remaining_q)
        info_col.addWidget(self.card_time_per_q)
        info_col.addWidget(self.card_elapsed)
        mid.addLayout(info_col, stretch=2)

        root.addLayout(mid, stretch=1)

        # Progress bar
        self.progress_bar = GradientProgressBar()
        root.addWidget(self.progress_bar)

        # Overview bar
        self.overview = OverviewBar()
        root.addWidget(self.overview)

    def _vdivider(self):
        div = QFrame()
        div.setFrameShape(QFrame.Shape.VLine)
        div.setFixedWidth(1)
        div.setStyleSheet("background: rgba(255,255,255,15); border: none;")
        return div

    def _make_input_group(self, name, color, accent, default_q, default_t):
        layout = QVBoxLayout()
        layout.setSpacing(6)
        label = QLabel(name)
        label.setFont(QFont("Segoe UI", 14, QFont.Weight.Bold))
        label.setStyleSheet(f"color: {color};")
        layout.addWidget(label)

        grid = QGridLayout()
        grid.setSpacing(8)
        grid.addWidget(self._small_label("Questions"), 0, 0)
        q_spin = QSpinBox(); q_spin.setRange(0, 200); q_spin.setValue(default_q)
        grid.addWidget(q_spin, 0, 1)
        grid.addWidget(self._small_label("Minutes"), 1, 0)
        t_spin = QSpinBox(); t_spin.setRange(0, 600); t_spin.setValue(default_t)
        grid.addWidget(t_spin, 1, 1)
        layout.addLayout(grid)
        return {"layout": layout, "q_spin": q_spin, "t_spin": t_spin,
                "color": color, "accent": accent}

    def _small_label(self, text):
        lbl = QLabel(text)
        lbl.setFont(QFont("Segoe UI", 11))
        lbl.setStyleSheet("color: rgba(255,255,255,80);")
        return lbl

    def _make_button(self, text, bg, hover):
        btn = QPushButton(text)
        btn.setFont(QFont("Segoe UI", 12, QFont.Weight.Bold))
        btn.setStyleSheet(f"""
            QPushButton {{
                background: {bg}; color: #ffffff; border: none;
                border-radius: 10px; padding: 10px 28px; letter-spacing: 1px;
            }}
            QPushButton:hover {{ background: {hover}; }}
            QPushButton:disabled {{
                background: rgba(255,255,255,8); color: rgba(255,255,255,35);
            }}
        """)
        return btn

    # ── Helpers ──

    def _total_remaining(self):
        return sum(s.remaining for s in self.sections)

    def _total_elapsed(self):
        return sum(s.elapsed for s in self.sections)

    def _total_duration(self):
        return sum(s.total_seconds for s in self.sections)

    def _total_fraction(self):
        t = self._total_duration()
        return min(1.0, self._total_elapsed() / t) if t > 0 else 0.0

    def _fmt(self, seconds):
        s = max(0, int(seconds))
        return f"{s // 60:02d}:{s % 60:02d}"

    # ── Controls ──

    def _on_start(self):
        self.sections.clear()
        mq = self.mcq_inputs["q_spin"].value()
        mt = self.mcq_inputs["t_spin"].value()
        fq = self.frq_inputs["q_spin"].value()
        ft = self.frq_inputs["t_spin"].value()
        if mq > 0 and mt > 0:
            self.sections.append(Section("MCQ", mt, mq, "#42a5f5", "#90caf9"))
        if fq > 0 and ft > 0:
            self.sections.append(Section("FRQ", ft, fq, "#ab47bc", "#ce93d8"))
        if not self.sections:
            return

        self.current_section_idx = 0
        self.running = True
        self.paused = False
        self.waiting_for_frq = False
        self._last_question_num = -1
        self.last_tick = time.time()
        self.start_btn.setEnabled(False)
        self.pause_btn.setEnabled(True)
        self.frq_start_btn.setVisible(False)
        self.pause_overlay.hide()
        self.timer.start()

    def _on_pause(self):
        if not self.running:
            return
        self.paused = not self.paused
        if not self.paused:
            self.last_tick = time.time()
            self.pause_overlay.hide()
        else:
            self.pause_overlay.setGeometry(self.centralWidget().rect())
            self.pause_overlay.show()
            self.pause_overlay.raise_()
        self.pause_btn.setText("▶  RESUME" if self.paused else "⏸  PAUSE")

    def _on_reset(self):
        self.timer.stop()
        self.running = False
        self.paused = False
        self.waiting_for_frq = False
        self.sections.clear()
        self.current_section_idx = -1
        self._last_question_num = -1
        self.start_btn.setEnabled(True)
        self.pause_btn.setEnabled(False)
        self.pause_btn.setText("⏸  PAUSE")
        self.frq_start_btn.setVisible(False)
        self.pause_overlay.hide()

        self.ring.set_state(0.0, QColor("#00e676"), "00:00",
                            total_text="00:00", section_name="", total_fraction=0.0)
        self.progress_bar.set_state(0.0, QColor("#00e676"))
        self.question_display.set_state(0, 0, QColor("#00e676"))
        self.section_label.setText("—")
        self.card_remaining_q.set_value("—")
        self.card_time_per_q.set_value("—")
        self.card_elapsed.set_value("—")
        self.overview.set_state([], -1)

    def _on_start_frq(self):
        self.waiting_for_frq = False
        self.frq_start_btn.setVisible(False)
        self.pause_btn.setEnabled(True)
        self._last_question_num = -1
        self.last_tick = time.time()

    # ── Tick ──

    def _tick(self):
        if not self.running:
            return
        if self.paused or self.waiting_for_frq:
            self._update_display()
            return

        now = time.time()
        dt = now - self.last_tick
        self.last_tick = now
        if self.slow_motion:
            dt *= self.slow_factor

        if self.current_section_idx >= len(self.sections):
            self._finish_exam()
            return

        sec = self.sections[self.current_section_idx]
        sec.elapsed += dt

        # ── Track per-question countdown ──
        # Detect if the question number changed → reset the question timer
        current_q = sec.current_question
        if current_q != self._last_question_num:
            # Question just changed — reset the per-question timer
            sec.question_timer_elapsed = 0.0
            self._last_question_num = current_q
        else:
            # Same question — accumulate time
            sec.question_timer_elapsed += dt

        if sec.remaining <= 0:
            sec.elapsed = float(sec.total_seconds)
            sec.finished = True
            self.current_section_idx += 1
            self._last_question_num = -1
            if self.current_section_idx >= len(self.sections):
                self._finish_exam()
                return
            if self.break_cb.isChecked():
                nxt = self.sections[self.current_section_idx]
                if nxt.name == "FRQ":
                    self.waiting_for_frq = True
                    self.frq_start_btn.setVisible(True)
                    self.pause_btn.setEnabled(False)
                    self.section_label.setText("BREAK — Press START FRQ")
                    self.section_label.setStyleSheet(
                        "color: #ffc107; background: transparent; border: none;")
        self._update_display()

    def _update_display(self):
        if self.current_section_idx < 0 or self.current_section_idx >= len(self.sections):
            return
        sec = self.sections[self.current_section_idx]
        color = urgency_color(sec.fraction)

        self.ring.set_state(
            sec.fraction, color, self._fmt(sec.remaining),
            total_text=self._fmt(self._total_remaining()),
            section_name=sec.name,
            total_fraction=self._total_fraction()
        )

        self.progress_bar.set_state(sec.fraction, color)

        if not self.waiting_for_frq:
            self.section_label.setText(sec.name)
            self.section_label.setStyleSheet(
                f"color: {sec.color.name()}; background: transparent; border: none;")

        self.question_display.set_state(sec.current_question, sec.questions, sec.color)
        self.card_remaining_q.set_value(str(sec.remaining_questions), color.name())

        # ── Sec/Question: show countdown for current question's budget ──
        q_remaining = sec.question_time_remaining
        budget = sec.sec_per_question
        # Colour the countdown: green→yellow→red as it runs out
        if budget > 0:
            q_frac_elapsed = sec.question_timer_elapsed / budget
            q_color = urgency_color(min(1.0, q_frac_elapsed))
            self.card_time_per_q.set_value(f"{q_remaining:.1f}s", q_color.name())
        else:
            self.card_time_per_q.set_value("—")

        em, es = int(sec.elapsed) // 60, int(sec.elapsed) % 60
        self.card_elapsed.set_value(f"{em:02d}:{es:02d}")
        self.overview.set_state(self.sections, self.current_section_idx)

    def _finish_exam(self):
        self.timer.stop()
        self.running = False
        self.start_btn.setEnabled(True)
        self.pause_btn.setEnabled(False)
        self.frq_start_btn.setVisible(False)
        self.ring.set_state(1.0, QColor("#ff1744"), "DONE",
                            total_text="00:00", section_name="FINISHED",
                            total_fraction=1.0)
        self.section_label.setText("Exam Complete")
        self.section_label.setStyleSheet(
            "color: #ff1744; background: transparent; border: none;")
        self.progress_bar.set_state(1.0, QColor("#ff1744"))
        self.overview.set_state(self.sections, len(self.sections))


# ──────────────────────────── Entry Point ────────────────────────────

def main():
    app = QApplication(sys.argv)
    palette = QPalette()
    palette.setColor(QPalette.ColorRole.Window, QColor("#0a0e1a"))
    palette.setColor(QPalette.ColorRole.WindowText, QColor("#e0e0e0"))
    palette.setColor(QPalette.ColorRole.Base, QColor("#0a0e1a"))
    palette.setColor(QPalette.ColorRole.Text, QColor("#e0e0e0"))
    palette.setColor(QPalette.ColorRole.Button, QColor("#0a0e1a"))
    palette.setColor(QPalette.ColorRole.ButtonText, QColor("#e0e0e0"))
    app.setPalette(palette)

    window = ExamTimerWindow()
    window.show()
    sys.exit(app.exec())


if __name__ == "__main__":
    main()