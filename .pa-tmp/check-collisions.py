import json, glob
mine = {'yubikey','google-titan','nitrokey','solokeys','feitian','token2','google-authenticator','microsoft-authenticator','authy','1password','bitwarden','proton-pass','ente-auth','2fas','unity','unreal','godot','threejs','babylonjs','bevy','playcanvas','phaser'}
for f in glob.glob('data/*/products.json'):
    if any(a in f for a in ['security-keys','authenticator-apps','game-engines']):
        continue
    for p in json.load(open(f)):
        if p['id'] in mine:
            print('COLLISION', f, p['id'])
print('check done')
