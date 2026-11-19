#!/usr/bin/env python3
"""Helper QA ADB generik: dump/tap/text/shot/activity/log dengan redaction otomatis.

Contoh:
  python scripts/qa_ui.py --serial 127.0.0.1:16384 dump --out bukti/ui_home.xml
  python scripts/qa_ui.py --serial 127.0.0.1:16384 tap --text "Masuk"
  python scripts/qa_ui.py --serial 127.0.0.1:16384 shot --out bukti/BUG-01-001.png
"""
import argparse, json, os, re, subprocess, sys, datetime
from pathlib import Path
from xml.etree import ElementTree as ET

DEFAULT_ADB = os.environ.get("QA_ADB", r"C:\Program Files\Netease\MuMuPlayer\nx_main\adb.exe")
SECRET = re.compile(
    r'(Bearer\s+\S+|(?:token|password|pass|nik|pin|secret)["\' :=]+[^\s,;]+)', re.I)


def audit(path, action, detail, result, decision=""):
    if not path:
        return
    p = Path(path)
    p.parent.mkdir(parents=True, exist_ok=True)
    entry = {
        "ts": datetime.datetime.now().isoformat(timespec="seconds"),
        "target": detail if len(str(detail)) < 160 else str(detail)[:160],
        "tool": "adb/uiautomator",
        "action": action,
        "result": result,
        "decision": decision,
    }
    with p.open("a", encoding="utf-8") as f:
        f.write(json.dumps(entry, ensure_ascii=False) + "\n")


def run(adb, serial, *args, check=False):
    cmd = [adb, "-s", serial, *args]
    r = subprocess.run(cmd, capture_output=True, text=True, errors="replace", check=check)
    return r


def dump(adb, serial, out: Path):
    run(adb, serial, "shell", "uiautomator", "dump", "/sdcard/qa_ui.xml")
    r = run(adb, serial, "shell", "cat", "/sdcard/qa_ui.xml")
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(r.stdout, encoding="utf-8")
    try:
        return ET.fromstring(r.stdout)
    except ET.ParseError:
        return ET.Element("hierarchy")


def node_by_text(root, text):
    for n in root.iter("node"):
        label = f"{n.get('text') or ''} {n.get('content-desc') or ''} {n.get('resource-id') or ''}"
        if text.lower() in label.lower() and n.get("enabled") == "true":
            return n
    raise SystemExit(f"Node tidak ditemukan: {text}")


def center(node):
    nums = [int(x) for x in re.findall(r"-?\d+", node.get("bounds", ""))]
    if len(nums) != 4:
        raise SystemExit(f"Bounds tidak valid: {node.get('bounds')}")
    x1, y1, x2, y2 = nums
    return (x1 + x2) // 2, (y1 + y2) // 2


def print_nodes(root):
    i = 0
    print(f"{'#':>3} {'C':3} {'SEL':3} {'CHK':5} {'CENTER':12} {'CLASS':14} {'TEXT/DESC/RID'}")
    for n in root.iter("node"):
        if not any([n.get("clickable") == "true", n.get("scrollable") == "true",
                    n.get("checkable") == "true", n.get("text"), n.get("content-desc")]):
            continue
        nums = [int(x) for x in re.findall(r"-?\d+", n.get("bounds", ""))]
        c = f"{(nums[0]+nums[2])//2},{(nums[1]+nums[3])//2}" if len(nums) == 4 else "-"
        flags = "".join([
            "C" if n.get("clickable") == "true" else ".",
            "S" if n.get("scrollable") == "true" else ".",
            "K" if n.get("checkable") == "true" else ".",
        ])
        label = (n.get("text") or n.get("content-desc") or n.get("resource-id") or "").replace("\n", " ")[:60]
        cls = n.get("class", "").split(".")[-1]
        print(f"{i:>3} {flags:3} {'Y' if n.get('selected')=='true' else '.':3} "
              f"{('Y:'+n.get('checked','')) if n.get('checkable')=='true' else '.':5} "
              f"{c:12} {cls:14} {label}")
        i += 1
    print(f"=== TOTAL NODES: {i} ===")


def main():
    p = argparse.ArgumentParser(description="QA ADB helper (dump/tap/text/shot/activity/log)")
    p.add_argument("--serial", default=os.environ.get("QA_SERIAL", "127.0.0.1:16384"))
    p.add_argument("--adb", default=DEFAULT_ADB)
    p.add_argument("--audit", default=os.environ.get("QA_AUDIT", ""))
    sub = p.add_subparsers(dest="cmd", required=True)

    sub.add_parser("devices")
    d = sub.add_parser("dump"); d.add_argument("--out", default="bukti/ui_current.xml")
    d.add_argument("--all", action="store_true", help="tampilkan semua node, bukan hanya interaktif")
    t = sub.add_parser("tap"); t.add_argument("--text"); t.add_argument("--x", type=int); t.add_argument("--y", type=int)
    x = sub.add_parser("text"); x.add_argument("--into", required=True); x.add_argument("--value", required=True)
    s = sub.add_parser("shot"); s.add_argument("--out", required=True)
    sub.add_parser("activity")
    l = sub.add_parser("log"); l.add_argument("--out", default="bukti/logcat.txt")
    a = p.parse_args()

    if a.cmd == "devices":
        r = subprocess.run([a.adb, "devices"], capture_output=True, text=True)
        print(r.stdout + r.stderr)
        audit(a.audit, "devices", "", "listed")
    elif a.cmd == "dump":
        out = Path(a.out)
        root = dump(a.adb, a.serial, out)
        print_nodes(root)
        audit(a.audit, "dump", str(out), f"saved->{out}")
    elif a.cmd == "tap":
        if a.text:
            root = dump(a.adb, a.serial, Path("bukti/ui_tap.xml"))
            cx, cy = center(node_by_text(root, a.text))
            detail = a.text
        elif a.x is not None and a.y is not None:
            cx, cy = a.x, a.y
            detail = f"{a.x},{a.y}"
        else:
            raise SystemExit("tap butuh --text atau --x --y")
        run(a.adb, a.serial, "shell", "input", "tap", str(cx), str(cy))
        print(f"TAP {cx},{cy}")
        audit(a.audit, "tap", detail, "sent")
    elif a.cmd == "text":
        root = dump(a.adb, a.serial, Path("bukti/ui_text.xml"))
        cx, cy = center(node_by_text(root, a.into))
        run(a.adb, a.serial, "shell", "input", "tap", str(cx), str(cy))
        run(a.adb, a.serial, "shell", "input", "text", a.value.replace(" ", "%s"))
        print(f"TEXT into {a.into}: [REDACTED]")
        audit(a.audit, "text", a.into, "sent (value redacted)")
    elif a.cmd == "shot":
        out = Path(a.out)
        out.parent.mkdir(parents=True, exist_ok=True)
        run(a.adb, a.serial, "shell", "screencap", "-p", "/sdcard/qa_shot.png")
        run(a.adb, a.serial, "pull", "/sdcard/qa_shot.png", str(out))
        ok = out.exists() and out.read_bytes()[:8] == b"\x89PNG\r\n\x1a\n"
        print(f"SAVED {out} PNG_OK={ok}")
        audit(a.audit, "shot", str(out), "PNG_OK" if ok else "PNG_INVALID")
    elif a.cmd == "activity":
        r = run(a.adb, a.serial, "shell", "dumpsys", "activity", "activities")
        for line in r.stdout.splitlines():
            if "topResumedActivity" in line or "mResumedActivity" in line:
                print(line.strip())
        audit(a.audit, "activity", "", "read")
    elif a.cmd == "log":
        r = run(a.adb, a.serial, "logcat", "-d", "-v", "time")
        lines = [SECRET.sub("[REDACTED]", x) for x in r.stdout.splitlines()[-500:]]
        out = Path(a.out)
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text("\n".join(lines), encoding="utf-8")
        print(f"SAVED {out} lines={len(lines)} (redacted)")
        audit(a.audit, "log", str(out), "saved (redacted)")


if __name__ == "__main__":
    main()
