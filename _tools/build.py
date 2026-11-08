"""Convert a Claude Design Main.dc.html into the static site. Usage: python3 build.py Main.dc.html REPO_DIR"""
import re, os, sys, subprocess
src, out = sys.argv[1], sys.argv[2]
t = open(src).read()
origin = 'https://661f0118-3cd0-4770-8430-7961d15e1745.frame.claudeusercontent.com'
imgdir = os.path.join(out, 'img'); os.makedirs(imgdir, exist_ok=True)
for f in os.listdir(imgdir): os.remove(os.path.join(imgdir, f))
names = {}
for bid in sorted(set(re.findall(r'/_blob/([0-9a-f]+)', t))):
    tmp = os.path.join(imgdir, bid)
    ct = subprocess.run(['curl', '-sS', '-o', tmp, '-w', '%{content_type}', f'{origin}/_blob/{bid}'], capture_output=True, text=True, check=True).stdout
    ext = {'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif', 'image/svg+xml': '.svg'}.get(ct.split(';')[0], '.jpg')
    os.rename(tmp, tmp + ext); names[bid] = bid + ext
helmet = re.search(r'<helmet>(.*?)</helmet>', t, re.S).group(1)
body = re.search(r'</helmet>(.*?)</x-dc>', t, re.S).group(1)
title = re.search(r'<title>.*?</title>', t).group(0)
fix = lambda s: re.sub(r'/_blob/([0-9a-f]+)', lambda m: 'img/' + names[m.group(1)], s)
import hashlib
ver = hashlib.md5(open(os.path.join(out, 'comments.js'), 'rb').read()).hexdigest()[:8]
open(os.path.join(out, 'index.html'), 'w').write(
    f'<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n{title}\n{fix(helmet)}\n<style id="pf-scale">body > :not([id^="pfc-"]):not(.pfc-pop){zoom:.8}</style>\n</head>\n<body>\n{fix(body)}\n<script>window.PFC_API="https://script.google.com/macros/s/AKfycbyQ06l4YIH_-Jl6RyuPqZngkhguKNeQVLRCsvALCMFCiFzRrBTey3BtrYDBbGGF1bge_Q/exec"</script>\n<script src="comments.js?v={ver}" defer></script>\n</body>\n</html>\n')
print(len(names), 'images')
