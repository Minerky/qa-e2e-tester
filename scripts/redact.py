# -*- coding: utf-8 -*-
"""Redact secret/PII dari file teks sebelum dimasukkan ke laporan."""
import re, sys, hashlib
from pathlib import Path

PATTERNS = [
    (re.compile(r'-----BEGIN .*?PRIVATE KEY-----.*?-----END .*?PRIVATE KEY-----', re.S), '[REDACTED_KEY]'),
    (re.compile(r'\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b'), '[REDACTED_JWT]'),
    (re.compile(r'(?i)\b(bearer|api[-_]?key|authorization|password|secret|token)\s*[:=]\s*[^\s,;"\']+'), r'\1=[REDACTED]'),
    (re.compile(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b'), '[REDACTED_EMAIL]'),
    (re.compile(r'\b(?:\+?62|0)8\d{8,11}\b'), '[REDACTED_PHONE]'),
    (re.compile(r'(?i)(chat_id|nik|pin|kode|userid|user_id)=[^&\s]+'), r'\1=[REDACTED]'),
    (re.compile(r'(?<!\d)\d{10}(?!\d)'), '[REDACTED]'),
]


def redact(text: str) -> str:
    for rx, rep in PATTERNS:
        text = rx.sub(rep, text)
    return text


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


if __name__ == '__main__':
    src = Path(sys.argv[1])
    dst = Path(sys.argv[2]) if len(sys.argv) > 2 else None
    data = redact(src.read_text(encoding='utf-8', errors='replace'))
    if dst:
        dst.parent.mkdir(parents=True, exist_ok=True)
        dst.write_text(data, encoding='utf-8')
        print(f'{src} -> {dst} | sha256={sha256(dst)}')
    else:
        print(data)
