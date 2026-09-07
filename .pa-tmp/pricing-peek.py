import re
import html as h
import urllib.request

UA = {'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'}
PAGES = {
    'incident.io': 'https://incident.io/pricing',
    'firehydrant': 'https://firehydrant.com/pricing/',
    'rootly': 'https://rootly.com/pricing',
    'betterstack': 'https://betterstack.com/pricing',
}
for name, url in PAGES.items():
    try:
        req = urllib.request.Request(url, headers=UA)
        t = urllib.request.urlopen(req, timeout=30).read().decode('utf-8', 'ignore')
        t = re.sub(r'<script.*?</script>', '', t, flags=re.S)
        t = re.sub(r'<style.*?</style>', '', t, flags=re.S)
        t = re.sub(r'<[^>]+>', ' ', t)
        t = h.unescape(t)
        t = re.sub(r'\s+', ' ', t)
        print('=====', name)
        for kw in ('$', 'Free', 'free', 'per user', 'per responder', 'Enterprise', 'Contact'):
            i = t.find(kw)
            if i >= 0:
                print(f'  [{kw}]', t[max(0, i - 80):i + 200].strip()[:260])
    except Exception as e:
        print(name, 'ERROR', e)
