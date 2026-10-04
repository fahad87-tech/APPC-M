"""
CONCEPT TAGGING ENGINE — "Blueprint & Brass"
=============================================
Assigns an AP Physics concept tag to every multiple-choice question in
data/exams.json so the app can report mastery per concept instead of
only per question.

Why heuristics instead of manual tagging:
  The College Board rationale text ("explanation") is the highest-signal
  free text available. Question stems were lost during PDF extraction
  (they live inside the card images), so the rationale carries the load.

Tagging precedence:
  1. Section override   — a few sections map 1:1 to a concept
  2. Keyword scoring    — weighted match over rationale + choice text
  3. Unit default       — safe fallback so every question has a tag

Usage:
    python tag_concepts.py            # write tags into exams.json + bundle
    python tag_concepts.py --dry-run  # report only, no writes
    python tag_concepts.py --audit    # print sample tags for review
"""
import argparse
import json
import os
import re
from collections import Counter, defaultdict

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data")
JSON_PATH = os.path.join(DATA_DIR, "exams.json")
BUNDLE_PATH = os.path.join(DATA_DIR, "exams_bundle.js")

# ---------------------------------------------------------------------------
# CONCEPT TAXONOMY
#
# "weight" multipliers let sharper physics terms outrank generic ones.
# Weights are applied to the number of distinct keyword hits, so a question
# mentioning three high-weight terms for one concept will beat a question
# that mentions one low-weight term for another.
# ---------------------------------------------------------------------------
CONCEPTS = {
    "vectors": {
        "label": "Vectors & Components",
        "color": "brass",
        "keywords": {
            "vector": 2, "vectors": 2, "component": 3, "components": 3,
            "magnitude": 2, "scalar": 3, "scalars": 3, "resultant": 3,
            "displacement": 2, "unit vector": 4, "dot product": 4,
            "cross product": 4, "angle between": 2, "direction": 1,
            "i hat": 4, "j hat": 4, "k hat": 4, "axis": 1,
            "right triangle": 2, "decompose": 3, "quadrant": 3,
        },
    },
    "kinematics_1d": {
        "label": "1D Kinematics",
        "color": "copper",
        # Bare "velocity"/"acceleration" appear in almost every AP Physics
        # rationale, including 2D and relative-motion questions. They are
        # deliberately weight 1 so a concept-specific term can outrank them.
        "keywords": {
            "acceleration": 1, "velocity": 1, "position": 1,
            "displacement": 2, "average velocity": 4, "instantaneous": 3,
            "slope": 2, "area under": 3,
            "constant acceleration": 4, "free fall": 3, "initial velocity": 2,
            "final velocity": 2, "average speed": 3, "elapsed time": 2,
            "one-dimensional": 4, "straight line": 3,
            "x-t graph": 4, "v-t graph": 4, "a-t graph": 4,
            "position-time": 3, "velocity-time": 3,
        },
    },
    "kinematics_2d": {
        "label": "2D Kinematics & Projectiles",
        "color": "copper",
        "keywords": {
            "projectile": 5, "horizontal": 2, "vertical": 2,
            "launch angle": 4, "initial speed": 2, "range": 2,
            "maximum height": 4, "time of flight": 4, "trajectory": 4,
            "horizontal component": 5, "vertical component": 5,
            "component of the": 3, "component of velocity": 5,
            "banked": 3, "at its highest point": 5, "straight up": 3,
            "initial upward": 5, "initial horizontal": 5,
        },
    },
    "relative_motion": {
        "label": "Relative Motion & Reference Frames",
        "color": "copper",
        "keywords": {
            "relative motion": 7, "relative velocity": 7,
            "relative to": 4, "reference frame": 6,
            "with respect to": 4, "relative to the ground": 6,
            "relative to the train": 6, "relative to the car": 6,
            "relative to the water": 6, "relative speed": 6,
            "velocity relative": 6, "ground is": 3,
            "frame of reference": 6, "as seen from": 4,
            "same for both": 2, "relative to each other": 5,
        },
    },
    "newton_1d": {
        "label": "Newton's First Law (Inertia)",
        "color": "plum",
        "keywords": {
            "inertia": 5, "newton's first law": 5, "net force": 2,
            "equilibrium": 2, "constant velocity": 3, "at rest": 2,
            "balanced forces": 4, "no net force": 4, "inertial": 3,
        },
    },
    "newton_2d": {
        "label": "Newton's Second Law",
        "color": "plum",
        "keywords": {
            "newton's second law": 5, "f = ma": 6, "acceleration is": 2,
            "net force": 3, "force on": 2, "mass is": 1,
            "proportional to": 1, "constant mass": 2, "constant net force": 3,
        },
    },
    "newton_3d": {
        "label": "Newton's Third Law",
        "color": "plum",
        "keywords": {
            "newton's third law": 6, "action-reaction": 6,
            "action reaction": 6, "third law": 5,
            "equal and opposite": 3, "pair of forces": 4,
            "force pair": 4, "contact force": 3,
        },
    },
    "fbd": {
        "label": "Free-Body Diagrams",
        "color": "plum",
        "keywords": {
            "free-body": 6, "free body": 6, "force diagram": 5,
            "draw the forces": 4, "which force": 2, "normal force": 3,
            "tension": 3, "applied force": 3, "frictional force": 3,
            "upward force": 2, "downward force": 2,
        },
    },
    "friction": {
        "label": "Friction",
        "color": "plum",
        "keywords": {
            "friction": 5, "coefficient of friction": 6,
            "kinetic friction": 5, "static friction": 5,
            "frictionless": 4, "sliding": 2, "coefficient": 2,
            "maximum static": 4,
        },
    },
    "gravity": {
        "label": "Gravity & Weight",
        "color": "plum",
        # "weight" alone scores low: buoyancy and normal-force questions use
        # it constantly without being about gravitation.
        "keywords": {
            "weight": 2, "gravitational": 4, "gravity": 3,
            "normal force": 2, "apparent weight": 6, "free-fall": 3,
            "acceleration due to gravity": 6,
            "scale reads": 5, "elevator": 4,
            "gravitational field": 6, "surface gravity": 5,
        },
    },
    "spring": {
        "label": "Springs & Elasticity",
        "color": "plum",
        "keywords": {
            "spring": 5, "hooke": 6, "elastic": 3, "equilibrium length": 5,
            "spring constant": 6, "compressed": 3, "stretched": 2,
            "restoring force": 3, "elastic limit": 4, "deformation": 3,
        },
    },
    "circular": {
        "label": "Circular Motion",
        "color": "plum",
        "keywords": {
            "circular motion": 6, "centripetal": 6, "circular path": 4,
            "radius of curvature": 4, "uniform circular": 5,
            "banked": 4, "vertical circle": 4, "centrifugal": 3,
            "radial": 2, "tangential": 2,
        },
    },
    "work": {
        "label": "Work",
        "color": "lime",
        "keywords": {
            "work done": 5, "work =": 4, "work by": 4,
            "work of": 4, "dot product": 2, "displacement": 1,
            "positive work": 4, "negative work": 4, "joule": 2,
            "component of": 1, "perpendicular": 2,
        },
    },
    "energy_kinetic": {
        "label": "Kinetic Energy",
        "color": "lime",
        "keywords": {
            "kinetic energy": 6, "work-energy": 5, "work energy theorem": 6,
            "change in kinetic": 4, "friction": 1, "speed": 1,
        },
    },
    "energy_potential": {
        "label": "Potential Energy",
        "color": "lime",
        "keywords": {
            "potential energy": 6, "gravitational potential": 6,
            "elastic potential": 6, "spring potential": 5,
            "height": 2, "reference level": 4, "change in potential": 4,
            "gravitational potential energy": 6,
        },
    },
    "energy_conservation": {
        "label": "Conservation of Energy",
        "color": "lime",
        "keywords": {
            "conservation of energy": 7, "mechanical energy": 6,
            "energy is conserved": 6, "total energy": 4,
            "kinetic plus potential": 5, "isolated system": 3,
        },
    },
    "power": {
        "label": "Power",
        "color": "lime",
        "keywords": {
            "power": 5, "watt": 5, "rate of doing work": 6,
            "rate of work": 5, "energy per unit time": 5,
        },
    },
    "momentum": {
        "label": "Momentum & Impulse",
        "color": "lime",
        # "angular momentum"/"impulse" are excluded here on purpose so the
        # rotational variants can claim them.
        "keywords": {
            "momentum": 3, "collision": 3,
            "conservation of momentum": 7,
            "final momentum": 4, "change in momentum": 4,
            "linear momentum": 6, "rebound": 2,
            "stick together": 3, "perfectly inelastic": 5,
            "elastic collision": 5, "p1": 2, "total momentum": 5,
        },
    },
    "rotation": {
        "label": "Rotational Kinematics",
        "color": "copper",
        # Weight 1 deliberately: "angular"/"rotating" show up across torque,
        # angular momentum and rotational energy questions too. The specific
        # concepts below must be able to outrank this catch-all.
        "keywords": {
            "angular": 1, "rotational": 1, "radian": 4, "revolution": 4,
            "angular velocity": 4, "angular acceleration": 4,
            "theta": 3, "rolling": 2, "rotates": 1, "rotating": 1,
            "period": 1, "frequency": 1, "rpm": 4,
            "angular position": 4, "angular displacement": 5,
            "average angular": 4, "kinematics equation": 2,
        },
    },
    "torque": {
        "label": "Torque & Equilibrium",
        "color": "copper",
        "keywords": {
            "torque": 5, "lever arm": 6, "moment arm": 5,
            "rotational equilibrium": 6, "net torque": 6,
            "pivot": 3, "center of mass": 2, "tipping": 4,
            "clockwise": 2, "counterclockwise": 2,
            "axis of rotation": 3, "torque of": 5,
        },
    },
    "moment_inertia": {
        "label": "Rotational Inertia",
        "color": "copper",
        "keywords": {
            "moment of inertia": 6, "rotational inertia": 6,
            "parallel axis": 6, "perpendicular axis": 5,
            "axis of rotation": 4, "point mass": 3, "radius of gyration": 5,
        },
    },
    "ang_momentum": {
        "label": "Angular Momentum & Impulse",
        "color": "copper",
        "keywords": {
            "angular momentum": 7, "conservation of angular": 7,
            "angular impulse": 7, "linear impulse": 5,
            "ice skater": 4, "rotating": 1, "angular collision": 5,
            "moment of inertia": 2,
        },
    },
    "rot_energy": {
        "label": "Rotational Energy",
        "color": "copper",
        "keywords": {
            "rotational kinetic": 7, "moment of inertia": 3,
            "angular velocity": 2, "rolling": 2,
            "total kinetic energy": 4, "translational kinetic": 6,
        },
    },
    "oscillations": {
        "label": "Oscillations & SHM",
        "color": "plum",
        "keywords": {
            "simple harmonic": 7, "harmonic": 5, "oscillator": 6,
            "oscillation": 6, "pendulum": 5, "equilibrium position": 3,
            "amplitude": 3, "period of": 3, "restoring": 2,
            "mass-spring": 5, "spring": 2, "sinusoidal": 4,
        },
    },
    "fluids": {
        "label": "Fluids",
        "color": "copper",
        "keywords": {
            "density": 5, "pressure": 4, "buoyant": 6,
            "archimedes": 6, "fluid": 4, "liquid": 2,
            "continuity equation": 6, "volume flow": 5,
            "pascals": 5, "displaced": 3, "floating": 3,
            "atmospheric": 3, "gauge pressure": 5, "submerged": 3,
        },
    },
    "graph_analysis": {
        "label": "Graph & Data Analysis",
        "color": "brass",
        # Kept narrow on purpose: "graph" alone is too common to score, so
        # only phrases that indicate deliberate graph interpretation count.
        "keywords": {
            "slope of the graph": 6, "slope of a position-time": 6,
            "area under the curve": 6, "area under the graph": 6,
            "position-time graph": 6, "velocity-time graph": 6,
            "velocity as a function of time": 6,
            "from the graph": 4, "graph is equal to": 4,
            "graph shows": 3, "graph indicates": 3,
            "slope is equal to": 5, "area under": 3,
            "spacing": 3, "shaded region": 4,
        },
    },
}

# ---------------------------------------------------------------------------
# SECTION OVERRIDES
# Some assessments map cleanly onto one concept. Applied first, and only
# when the assessment actually has a single dominant theme.
# Keyed by (subject_key, assessment_id) to avoid cross-course collisions.
# ---------------------------------------------------------------------------
SECTION_OVERRIDES = {
    ("APP1", "app1_unit1_1_1"): "vectors",
    ("APP1", "app1_unit1_1_3"): "graph_analysis",
    ("APP1", "app1_unit1_1_4"): "kinematics_2d",
    ("APP1", "app1_unit2_2_2"): "fbd",
    ("APP1", "app1_unit2_2_3"): "newton_3d",
    ("APP1", "app1_unit2_2_4"): "newton_1d",
    ("APP1", "app1_unit2_2_5"): "newton_2d",
    ("APP1", "app1_unit2_2_6"): "gravity",
    ("APP1", "app1_unit2_2_7"): "friction",
    ("APP1", "app1_unit2_2_8"): "spring",
    ("APP1", "app1_unit2_2_9"): "circular",
    ("APP1", "app1_unit3a_3_1"): "work",
    ("APP1", "app1_unit3a_3_2"): "energy_kinetic",
    ("APP1", "app1_unit3a_3_3"): "energy_potential",
    ("APP1", "app1_unit3a_3_4"): "energy_conservation",
    ("APP1", "app1_unit3a_3_5"): "power",
    ("APP1", "app1_unit4_4_1"): "momentum",
    ("APP1", "app1_unit4_4_2"): "momentum",
    ("APP1", "app1_unit4_4_3"): "momentum",
    ("APP1", "app1_unit4_4_4"): "momentum",
    ("APP1", "app1_unit5_5_2"): "rotation",
    ("APP1", "app1_unit5_5_3"): "torque",
    ("APP1", "app1_unit5_5_4"): "moment_inertia",
    ("APP1", "app1_unit5_5_5"): "torque",
    ("APP1", "app1_unit5_5_6"): "torque",
    ("APP1", "app1_unit6_6_1"): "rot_energy",
    ("APP1", "app1_unit6_6_2"): "ang_momentum",
    ("APP1", "app1_unit6_6_3"): "ang_momentum",
    ("APP1", "app1_unit6_6_4"): "rot_energy",
    ("APP1", "app1_unit7_7_1"): "oscillations",
    ("APP1", "app1_unit7_7_2"): "oscillations",
    ("APP1", "app1_unit7_7_3"): "oscillations",
    ("APP1", "app1_unit7_7_4"): "oscillations",
    ("APP1", "app1_unit8_8_1"): "fluids",
    ("APP1", "app1_unit8_8_2"): "fluids",
    ("APP1", "app1_unit8_8_3"): "fluids",
    ("APP1", "app1_unit8_8_4"): "fluids",

    ("APPC", "appc_unit1_1_4"): "kinematics_2d",
    ("APPC", "appc_unit1_1_5"): "kinematics_2d",
    ("APPC", "appc_unit2_2_2"): "fbd",
    ("APPC", "appc_unit2_2_4"): "newton_3d",
    ("APPC", "appc_unit2_2_5"): "friction",
    ("APPC", "appc_unit2_2_6"): "friction",
    ("APPC", "appc_unit2_2_7"): "gravity",
    ("APPC", "appc_unit2_2_8"): "spring",
    ("APPC", "appc_unit2_2_9"): "circular",
    ("APPC", "appc_unit2_2_10"): "newton_2d",
    ("APPC", "appc_unit3_3_1"): "work",
    ("APPC", "appc_unit3_3_2"): "energy_kinetic",
    ("APPC", "appc_unit3_3_3"): "energy_potential",
    ("APPC", "appc_unit3_3_4"): "energy_conservation",
    ("APPC", "appc_unit3_3_5"): "power",
    ("APPC", "appc_unit4_4_1"): "momentum",
    ("APPC", "appc_unit4_4_2"): "momentum",
    ("APPC", "appc_unit4_4_3"): "momentum",
    ("APPC", "appc_unit4_4_4"): "momentum",
    ("APPC", "appc_unit5_5_1"): "rotation",
    ("APPC", "appc_unit5_5_2"): "rotation",
    ("APPC", "appc_unit5_5_3"): "torque",
    ("APPC", "appc_unit5_5_4"): "moment_inertia",
    ("APPC", "appc_unit5_5_5"): "torque",
    ("APPC", "appc_unit5_5_6"): "torque",
    ("APPC", "appc_unit6_6_1"): "rot_energy",
    ("APPC", "appc_unit6_6_2"): "rot_energy",
    ("APPC", "appc_unit6_6_3"): "ang_momentum",
    ("APPC", "appc_unit6_6_4"): "ang_momentum",
    ("APPC", "appc_unit6_6_5"): "ang_momentum",
    ("APPC", "appc_unit6_6_6"): "circular",
    ("APPC", "appc_unit7_7_1"): "oscillations",
    ("APPC", "appc_unit7_7_2"): "oscillations",
    ("APPC", "appc_unit7_7_3"): "oscillations",
    ("APPC", "appc_unit7_7_4"): "oscillations",
    ("APPC", "appc_unit7_7_5"): "oscillations",
}

# Fallback concept per (subject_key, unit_name) for questions that score zero.
UNIT_DEFAULTS = {
    ("APP1", "Unit 1"): "kinematics_1d",
    ("APP1", "Unit 2"): "newton_2d",
    ("APP1", "Unit 3"): "energy_conservation",
    ("APP1", "Unit 4"): "momentum",
    ("APP1", "Unit 5"): "torque",
    ("APP1", "Unit 6"): "ang_momentum",
    ("APP1", "Unit 7"): "oscillations",
    ("APP1", "Unit 8"): "fluids",
    ("APPC", "Unit 1"): "kinematics_1d",
    ("APPC", "Unit 2"): "newton_2d",
    ("APPC", "Unit 3"): "energy_conservation",
    ("APPC", "Unit 4"): "momentum",
    ("APPC", "Unit 5"): "torque",
    ("APPC", "Unit 6"): "ang_momentum",
    ("APPC", "Unit 7"): "oscillations",
}

# Sections whose questions are topically homogeneous. When the keyword
# signal is weak inside one of these, deferring to the section topic is a
# better guess than the unit default.
SECTION_OVERRIDE_FALLBACKS = {
    ("APP1", "app1_unit1_1_5"): "kinematics_2d",
    ("APP1", "app1_unit1_1_1"): "vectors",
    ("APP1", "app1_unit1_1_2"): "kinematics_1d",
    ("APP1", "app1_unit1_1_3"): "graph_analysis",
    ("APP1", "app1_unit1_1_4"): "relative_motion",
}

BUNDLE_HEADER = "// VectorSelect by Mr. F — AP Physics Assessments Database"


def build_text(question):
    """Concatenate every scrap of free text available for a question."""
    parts = []
    exp = question.get("explanation")
    if exp:
        parts.append(exp)
    prompt = question.get("prompt")
    if prompt:
        parts.append(prompt)
    for choice in question.get("choices", []) or []:
        txt = choice.get("text")
        if txt:
            parts.append(txt)
    return " ".join(parts)


def normalize(text):
    """Lowercase and collapse whitespace. Keep unicode letters (rationales
    contain real apostrophes and accented characters)."""
    return re.sub(r"\s+", " ", text.lower())


def score_concepts(text):
    """Return {concept: score} for every concept with at least one hit."""
    haystack = normalize(text)
    scores = {}
    for concept, spec in CONCEPTS.items():
        total = 0.0
        for keyword, weight in spec["keywords"].items():
            occurrences = haystack.count(keyword)
            if occurrences:
                # Diminishing returns: a term repeated 10x is not 10x the
                # signal. First hit counts fully, subsequent hits are damped.
                total += weight * (1 + 0.25 * (min(occurrences, 4) - 1))
        if total > 0:
            scores[concept] = total
    return scores


def choose_concept(question, subject_key, unit_name, assessment_id):
    """
    Decide one concept for a question.

    Resolution order:
      1. Keyword scoring  — preferred for mixed assessments and when a
         single concept dominates the rationale text.
      2. Section override — applies when keyword signal is weak, so a
         question inside "2D Kinematics" never falls back to "1D".
      3. Unit default     — last resort for progress checks that mix ideas
         and have little recoverable text.

    This ordering matters: an earlier version preferred the section override
    outright, which is right for topic-focused sections but wrong for
    progress checks that deliberately mix topics.
    """
    text = build_text(question)
    section = SECTION_OVERRIDES.get((subject_key, assessment_id))

    scores = score_concepts(text)
    if scores:
        ordered = sorted(scores.values(), reverse=True)
        best = max(scores, key=scores.get)
        margin = ordered[0] - (ordered[1] if len(ordered) > 1 else 0)
        # Require both a reasonable absolute score and a clear winner so we
        # do not commit to a concept on the strength of one stray word.
        if scores[best] >= 3.0 and margin >= 1.5:
            return best, "keyword", scores

    if section:
        return section, "section", scores

    relaxed = SECTION_OVERRIDE_FALLBACKS.get((subject_key, assessment_id))
    if relaxed:
        return relaxed, "section-soft", scores

    return UNIT_DEFAULTS.get((subject_key, unit_name), "kinematics_1d"), "default", scores


def dedupe_assessments(db):
    """
    Remove repeated assessments within a unit.

    The extractor can emit the same assessment twice when a scoring guide and
    a test booklet resolve to the same slug. Duplicate ids break the lookup in
    the student portal (findQuizById returns the first match) and skew any
    per-assessment analytics, so only the first occurrence is kept.
    """
    removed = []
    for subject_key, subject in db["subjects"].items():
        for unit_name, unit in subject["units"].items():
            seen = set()
            kept = []
            for assessment in unit["assessments"]:
                a_id = assessment["id"]
                if a_id in seen:
                    removed.append(f"{subject_key}/{unit_name}: {a_id}")
                    continue
                seen.add(a_id)
                kept.append(assessment)
            unit["assessments"] = kept
    return removed


def prune_unrenderable(db, assets_dir=None):
    """
    Remove questions a student could never actually answer.

    A question needs either a card image that exists on disk, or prompt
    text, to be answerable. The extractor produced 52 questions with
    neither — they exist in the scoring guide but their card crop failed
    and no prompt survived text extraction. Shipping them would show a
    blank screen with four buttons, so they are dropped and reported.

    Also flags assessments whose question numbering has gaps, which means
    the extractor silently lost questions from that booklet.
    """
    if assets_dir is None:
        assets_dir = os.path.join(BASE_DIR, "assets")

    cards_dir = os.path.join(assets_dir, "cards")
    missing_files = set()
    if os.path.isdir(cards_dir):
        for entry in os.listdir(cards_dir):
            if entry.lower().endswith(".png"):
                missing_files.add(entry.lower())
    else:
        print(f"WARNING: cards directory not found at {cards_dir}")
        print("         Skipping the on-disk card check; only prompt text will be used.")
        return [], []

    dropped = []
    sparse = []

    for subject_key, subject in db["subjects"].items():
        for unit_name, unit in subject["units"].items():
            for assessment in unit["assessments"]:
                questions = assessment["questions"]
                keep = []
                for q in questions:
                    card = q.get("card_image") or ""
                    has_card = False
                    if card:
                        fname = card.split("/")[-1].split("\\")[-1]
                        has_card = fname.lower() in missing_files
                    has_prompt = bool((q.get("prompt") or "").strip())
                    if not has_card and not has_prompt:
                        dropped.append(
                            f"{subject_key}/{unit_name}/{assessment['id']} Q{q['number']}"
                        )
                        continue
                    keep.append(q)

                if keep:
                    assessment["questions"] = keep
                    assessment["question_count"] = len(keep)

                numbers = [q["number"] for q in keep]
                if numbers:
                    expected = set(range(min(numbers), max(numbers) + 1))
                    gaps = sorted(expected - set(numbers))
                    if gaps:
                        sparse.append(
                            f"{subject_key}/{unit_name}/{assessment['id']} "
                            f"missing Q{gaps} (has {len(numbers)} of {max(numbers)})"
                        )

            # An assessment with no renderable questions left is not usable.
            unit["assessments"] = [a for a in unit["assessments"] if a.get("questions")]

    return dropped, sparse


def tag_database(db, dry_run=False, audit=False):
    stats = Counter()
    concept_counts = Counter()
    per_unit = defaultdict(Counter)
    audit_rows = []

    for subject_key, subject in db["subjects"].items():
        for unit_name, unit in subject["units"].items():
            for assessment in unit["assessments"]:
                a_id = assessment["id"]
                for question in assessment["questions"]:
                    concept, method, scores = choose_concept(
                        question, subject_key, unit_name, a_id
                    )
                    stats[method] += 1
                    concept_counts[concept] += 1
                    per_unit[unit_name][concept] += 1

                    if audit and len(audit_rows) < 60:
                        top = sorted(scores.items(), key=lambda kv: -kv[1])[:3]
                        audit_rows.append({
                            "assessment": a_id,
                            "q": question.get("number"),
                            "concept": concept,
                            "method": method,
                            "top3": ", ".join(f"{k}:{v:.1f}" for k, v in top) or "—",
                        })

                    if not dry_run:
                        question["concept"] = concept
                        question["concept_label"] = CONCEPTS[concept]["label"]

    return stats, concept_counts, per_unit, audit_rows


def write_outputs(db):
    with open(JSON_PATH, "w", encoding="utf-8") as fh:
        json.dump(db, fh, indent=2, ensure_ascii=False)

    with open(BUNDLE_PATH, "w", encoding="utf-8") as fh:
        fh.write(BUNDLE_HEADER + "\n")
        fh.write("window.EXAM_DATA = ")
        json.dump(db, fh, indent=2, ensure_ascii=False)
        fh.write(";\n")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--audit", action="store_true")
    args = parser.parse_args()

    with open(JSON_PATH, "r", encoding="utf-8") as fh:
        db = json.load(fh)

    removed = dedupe_assessments(db)
    if removed:
        print("Duplicate assessments removed:")
        for note in removed:
            print(f"  - {note}")
        print()

    dropped, sparse = prune_unrenderable(db)
    if dropped:
        print(f"Unrenderable questions removed ({len(dropped)}):")
        for note in dropped[:12]:
            print(f"  - {note}")
        if len(dropped) > 12:
            print(f"  ... and {len(dropped) - 12} more")
        print("  (no card image on disk and no prompt text — students could not")
        print("   answer these; re-run build_exam_database.py to regenerate them)")
        print()

    if sparse:
        print("Assessments with numbering gaps (extractor lost questions):")
        for note in sparse:
            print(f"  ! {note}")
        print()

    stats, concept_counts, per_unit, audit_rows = tag_database(
        db, dry_run=args.dry_run, audit=args.audit
    )

    total = sum(stats.values())
    print("=" * 62)
    print("CONCEPT TAGGING")
    print("=" * 62)
    print(f"Questions tagged: {total}")
    for method, count in stats.most_common():
        pct = 100.0 * count / total if total else 0
        print(f"  {method:<10} {count:>5}  ({pct:.1f}%)")
    print()

    print("Coverage across taxonomy:")
    for concept in sorted(CONCEPTS):
        count = concept_counts.get(concept, 0)
        bar = "#" * min(40, count // 8)
        print(f"  {CONCEPTS[concept]['label']:<32} {count:>5}  {bar}")
    unused = [c for c in CONCEPTS if concept_counts.get(c, 0) == 0]
    if unused:
        print()
        print("  WARNING - concepts with zero questions:")
        for c in unused:
            print(f"    - {c} ({CONCEPTS[c]['label']})")
    print()

    if args.audit:
        print("Sample tags (review these):")
        print(f"  {'assessment':<34} {'q':>3}  {'concept':<24} {'via':<9} top3")
        print("  " + "-" * 96)
        for row in audit_rows:
            print(f"  {row['assessment']:<34} {row['q']:>3}  "
                  f"{row['concept']:<24} {row['method']:<9} {row['top3']}")
        print()

    if args.dry_run:
        print("DRY RUN - no files written.")
        return

    write_outputs(db)
    print(f"Wrote {JSON_PATH}")
    print(f"Wrote {BUNDLE_PATH}")


if __name__ == "__main__":
    main()