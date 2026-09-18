"""Exercise the compiled Windows app using only a disposable workbook."""
import hashlib,json,os,shutil,socket,subprocess,sys,tempfile,time,urllib.request
from pathlib import Path
exe=Path(sys.argv[1]).resolve()
source=Path(__file__).resolve().parent/'Resource_Planning_Database.xlsx'
with tempfile.TemporaryDirectory(prefix='Planner smoke ') as tmp:
 folder=Path(tmp);shutil.copy2(exe,folder/exe.name);book=folder/source.name;shutil.copy2(source,book)
 subprocess.run([str(folder/exe.name),'--check'],cwd=folder.parent,check=True,timeout=60)
 with socket.socket() as sock:sock.bind(('127.0.0.1',0));port=sock.getsockname()[1]
 proc=subprocess.Popen([str(folder/exe.name),'--no-browser','--port',str(port)],cwd=folder.parent)
 try:
  url=f'http://127.0.0.1:{port}'
  for attempt in range(100):
   try:
    with urllib.request.urlopen(url+'/api/plan',timeout=2) as r:data=json.load(r)
    break
   except OSError:
    if proc.poll() is not None:raise RuntimeError('Executable stopped before serving')
    time.sleep(.3)
  else:raise RuntimeError('Executable did not start')
  with urllib.request.urlopen(url,timeout=5) as r:assert b'<html' in r.read()
  original=book.read_bytes();data['plan']['projects'][0]['name']='Windows executable save test'
  body=json.dumps({'plan':data['plan'],'revision':data['revision']}).encode()
  request=urllib.request.Request(url+'/api/plan',body,{'Content-Type':'application/json','X-Local-Token':data['token']},method='PUT')
  with urllib.request.urlopen(request,timeout=15) as r:assert r.status==200
  with urllib.request.urlopen(url+'/api/plan',timeout=5) as r:assert json.load(r)['plan']['projects'][0]['name']=='Windows executable save test'
  assert book.read_bytes()!=original
  backups=list((folder/'backups').glob('*.xlsx'));assert len(backups)==1 and backups[0].read_bytes()==original
  print('PASS: compiled executable starts from another working directory, loads UI, saves Excel, creates exact backup.')
 finally:
  subprocess.run(['taskkill','/PID',str(proc.pid),'/T','/F'],capture_output=True)
  proc.wait(timeout=15)
