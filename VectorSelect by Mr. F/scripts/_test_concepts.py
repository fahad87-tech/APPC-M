# Offline harness for the concept analytics logic.
# Mirrors buildConceptAnalytics() from teacher.html so the maths can be
# verified without a browser.
import json
import os
import random
from collections import defaultdict

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
db = json.load(open(os.path.join(BASE, "data", "exams.json"), encoding="utf-8"))

META = {}
meta_src = open(os.path.join(BASE, "data", "concepts.js"), encoding="utf-8").read()
for key, label in [
    ("vectors", "Vectors & Components"), ("kinematics_1d", "1D Kinematics"),
    ("kinematics_2d", "2D Kinematics"), ("relative_motion", "Relative Motion"),
    ("graph_analysis", "Graph Analysis"), ("newton_1d", "Newton 1st"),
    ("newton_2d", "Newton 2nd"), ("newton_3d", "Newton 3rd"), ("fbd", "FBD"),
    ("friction", "Friction"), ("gravity", "Gravity"), ("spring", "Springs"),
    ("circular", "Circular"), ("work", "Work"),
    ("energy_kinetic", "Kinetic E"), ("energy_potential", "Potential E"),
    ("energy_conservation", "Conservation"), ("power", "Power"),
    ("momentum", "Momentum"), ("rotation", "Rotation"), ("torque", "Torque"),
    ("moment_inertia", "Inertia"), ("ang_momentum", "Ang Momentum"),
    ("rot_energy", "Rot Energy"), ("oscillations", "Oscillations"),
    ("fluids", "Fluids"),
]:
    META[key] = label


def band(acc):
    if acc >= 0.85:
        return "secured"
    if acc >= 0.70:
        return "developing"
    if acc >= 0.55:
        return "shaky"
    return "priority"


def build(quiz, subs):
    by_concept = {}
    per_question = []
    for qIdx, q in enumerate(quiz):
        key = q.get("concept", "unclassified")
        stats = {"qIdx": qIdx, "number": q["number"], "concept": key,
                 "correct": q["correct_answer"], "total": 0,
                 "correctCount": 0, "distractor": {}}
        for s in subs:
            if not s.get("answers"):
                continue
            chosen = s["answers"].get(str(qIdx), s["answers"].get(qIdx))
            if chosen in (None, ""):
                continue
            stats["total"] += 1
            if chosen == q["correct_answer"]:
                stats["correctCount"] += 1
            else:
                stats["distractor"][chosen] = stats["distractor"].get(chosen, 0) + 1
        by_concept.setdefault(key, {"key": key, "questions": 0,
                                    "opportunities": 0, "correct": 0})
        by_concept[key]["questions"] += 1
        by_concept[key]["opportunities"] += stats["total"]
        by_concept[key]["correct"] += stats["correctCount"]
        per_question.append(stats)

    concepts = []
    for c in by_concept.values():
        acc = c["correct"] / c["opportunities"] if c["opportunities"] else 0
        concepts.append({**c, "accuracy": acc, "band": band(acc)})
    concepts.sort(key=lambda c: c["accuracy"])

    misconceptions = []
    for qs in per_question:
        if qs["total"] < 3:
            continue
        for letter, count in qs["distractor"].items():
            share = count / qs["total"]
            if share >= 0.3:
                misconceptions.append({**qs, "letter": letter,
                                       "count": count, "share": share})
    misconceptions.sort(key=lambda m: -m["share"])

    groups = defaultdict(list)
    for s in subs:
        if not s.get("answers"):
            continue
        per_student = defaultdict(lambda: {"right": 0, "total": 0})
        for qIdx, q in enumerate(quiz):
            chosen = s["answers"].get(str(qIdx), s["answers"].get(qIdx))
            if chosen in (None, ""):
                continue
            key = q.get("concept", "unclassified")
            per_student[key]["total"] += 1
            if chosen == q["correct_answer"]:
                per_student[key]["right"] += 1
        scored = sorted(
            ((k, v["right"] / v["total"], v["total"])
             for k, v in per_student.items() if v["total"] > 0),
            key=lambda kv: kv[1])
        if scored:
            k, acc, tot = scored[0]
            groups[k].append({"name": s["student_name"], "acc": acc,
                              "right": round(acc * tot), "total": tot})

    remediation = [{"key": k, "students": v}
                   for k, v in groups.items() if len(v) >= 2]
    return concepts, misconceptions, remediation


random.seed(7)
assessment = db["subjects"]["APP1"]["units"]["Unit 1"]["assessments"][0]
print(f"Quiz: {assessment['title']}  ({len(assessment['questions'])} questions)")
print("Concepts in quiz:",
      sorted({q["concept"] for q in assessment["questions"]}))
print()

names = ["Alice", "Brian", "Carla", "Dev", "Elena", "Farah",
         "Gus", "Hana", "Ivan", "Jules"]

subs = []
for i, name in enumerate(names):
    # Vary ability so concept bands differ across students.
    skill = 0.35 + 0.055 * i
    answers = {}
    for qIdx, q in enumerate(assessment["questions"]):
        if random.random() < 0.06:
            continue  # leave blank sometimes
        if random.random() < skill:
            answers[str(qIdx)] = q["correct_answer"]
        else:
            wrong = [c for c in "ABCD" if c != q["correct_answer"]]
            answers[str(qIdx)] = random.choice(wrong)
    subs.append({"student_name": name, "answers": answers})

concepts, misconceptions, remediation = build(assessment["questions"], subs)

print("CONCEPT MASTERY (weakest first)")
for c in concepts:
    pct = round(c["accuracy"] * 100)
    print(f"  {META.get(c['key'], c['key']):<18} {c['correct']:>3}/{c['opportunities']:<3} "
          f"{pct:>4}%  [{c['band']}]")

print()
print(f"MISCONCEPTIONS ({len(misconceptions)} flagged)")
for m in misconceptions[:6]:
    print(f"  Q{m['number']:<3} {m['letter']} picked by {m['count']}/{m['total']} "
          f"({round(m['share']*100)}%) — key {m['correct']} "
          f"[{META.get(m['concept'], m['concept'])}]")

print()
print(f"REMEDIATION GROUPS ({len(remediation)})")
for g in remediation:
    who = ", ".join(f"{s['name']}({s['right']}/{s['total']})"
                    for s in sorted(g["students"], key=lambda x: x["acc"]))
    print(f"  {META.get(g['key'], g['key']):<18} {who}")

assert concepts, "no concept rows produced"
assert all(c["opportunities"] >= 0 for c in concepts)
print()
print("OK - analytics produced valid output")