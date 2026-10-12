#!/usr/bin/env python3
"""Generate QR codes for the book (巻末) and print use. Usage: make_qr.py <url> <out.png>"""
import sys, qrcode
url, out = sys.argv[1], sys.argv[2]
qr = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_M, box_size=12, border=2)
qr.add_data(url); qr.make(fit=True)
qr.make_image(fill_color="#141414", back_color="white").save(out)
print("qr", out, url)
