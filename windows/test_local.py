import copy
import http.client
import importlib.util
import json
from pathlib import Path
import shutil
import tempfile
import threading
import unittest
from zipfile import ZipFile
ROOT=Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location('planner',ROOT/'Resource_Planner.py');app=importlib.util.module_from_spec(spec);spec.loader.exec_module(app)

class LocalDatabaseTests(unittest.TestCase):
 def setUp(self):
  self.temp=tempfile.TemporaryDirectory();self.file=Path(self.temp.name)/app.DEFAULT_WORKBOOK;shutil.copy2(ROOT/app.DEFAULT_WORKBOOK,self.file)
 def tearDown(self):self.temp.cleanup()
 def test_initial_data_and_real_excel_dates(self):
  p,d=app.read_workbook(self.file);self.assertEqual([len(p[x]) for x in ('projects','people','bars','milestones')],[4,14,15,15]);self.assertEqual(p['bars'][0]['start'],5);self.assertEqual(p['bars'][0]['end'],18);self.assertEqual(len(d),6)
 def test_roundtrip_new_rows_dates_unassigned_backup_and_styles(self):
  p,d=app.read_workbook(self.file);original=self.file.read_bytes();before=app.read_parts(self.file)
  p['projects'].append(dict(id='PX',name='Literal =text & <project>',code='TEST',customer='',location='',status='Planning'))
  p['people'].append(dict(id='UX',name='QA Person',dept='PSE',title='Engineer',location='Atlanta'))
  p['bars'].append(dict(id='BX',project='PX',dept='PSE',start=0,end=23,allocation=1.5,personId='UX'))
  p['milestones'].append(dict(id='MX',project='PX',label='Go live',type='external',month=23))
  revision=app.write_workbook(self.file,p,app.revision_of(self.file));actual,_=app.read_workbook(self.file);self.assertEqual(actual,p);self.assertEqual(revision,app.revision_of(self.file))
  backups=list((self.file.parent/'backups').glob('*.xlsx'));self.assertEqual(len(backups),1);self.assertEqual(backups[0].read_bytes(),original)
  after=app.read_parts(self.file);self.assertEqual(before['xl/styles.xml'],after['xl/styles.xml']);self.assertEqual(before['xl/worksheets/sheet6.xml'],after['xl/worksheets/sheet6.xml'])
  self.assertIn(b'ref="A4:G20"',after['xl/tables/table3.xml']);self.assertIn(b'inlineStr',after['xl/worksheets/sheet1.xml'])
 def test_empty_optional_tables_and_readding_data(self):
  p,_=app.read_workbook(self.file);p['bars']=[];p['people']=[];p['milestones']=[];app.write_workbook(self.file,p,app.revision_of(self.file));self.assertEqual(app.read_workbook(self.file)[0],p)
  p['bars']=[dict(id='BX',project='P1',dept='FE',start=0,end=23,allocation=.25)];app.write_workbook(self.file,p,app.revision_of(self.file));self.assertEqual(app.read_workbook(self.file)[0],p)
 def test_invalid_reference_and_dates_do_not_modify_workbook(self):
  p,_=app.read_workbook(self.file);before=self.file.read_bytes()
  for change in [dict(personId='missing'),dict(end=25),dict(allocation=0),dict(start=19,end=2)]:
   q=copy.deepcopy(p);q['bars'][0].update(change)
   with self.assertRaises(app.DataError):app.write_workbook(self.file,q,app.revision_of(self.file))
   self.assertEqual(self.file.read_bytes(),before)
 def test_revision_conflict_and_excel_lock_preserve_data(self):
  p,_=app.read_workbook(self.file);before=self.file.read_bytes()
  with self.assertRaises(app.ConflictError):app.write_workbook(self.file,p,'old-revision')
  lock=self.file.with_name('~$'+self.file.name);lock.write_text('test')
  with self.assertRaises(app.ConflictError):app.write_workbook(self.file,p,app.revision_of(self.file))
  self.assertEqual(self.file.read_bytes(),before)
 def test_launcher_lock(self):
  with app.WorkbookLock(self.file):
   with self.assertRaises(app.DataError):
    with app.WorkbookLock(self.file):pass
 def test_http_ui_load_save_tokens_origins_and_stale_tabs(self):
  server=app.PlannerServer(('127.0.0.1',0),self.file,app.unpack_assets());thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start()
  def request(method,path,payload=None,headers=None):
   connection=http.client.HTTPConnection('127.0.0.1',server.server_port,timeout=3)
   connection.request(method,path,body=json.dumps(payload) if payload is not None else None,headers=headers or {});r=connection.getresponse();body=r.read();status=r.status;connection.close();return status,body
  try:
   status,html=request('GET','/');self.assertEqual(status,200);self.assertIn(b'Project planner',html)
   status,body=request('GET','/api/plan');data=json.loads(body);self.assertEqual(status,200)
   plan=data['plan'];plan['bars'][0]['allocation']=.75;payload=dict(plan=plan,revision=data['revision']);headers={'Content-Type':'application/json','X-Local-Token':data['token']}
   self.assertEqual(request('PUT','/api/plan',payload)[0],403)
   self.assertEqual(request('PUT','/api/plan',payload,{**headers,'Origin':'https://other.example'})[0],403)
   self.assertEqual(request('PUT','/api/plan',payload,headers)[0],200)
   self.assertEqual(app.read_workbook(self.file)[0]['bars'][0]['allocation'],.75)
   self.assertEqual(request('PUT','/api/plan',payload,headers)[0],409)
   self.assertEqual(request('GET','/api/plan',headers={'Host':'other.example'})[0],403)
   self.assertEqual(request('GET','/'+app.DEFAULT_WORKBOOK)[0],404)
  finally:server.shutdown();server.server_close();thread.join()

if __name__=='__main__':unittest.main(verbosity=2)
