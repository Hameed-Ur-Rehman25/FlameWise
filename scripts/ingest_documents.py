"""Index locally acquired page-separated report text. Only registered NASA sources allowed.
Usage: python3 scripts/ingest_documents.py manifest.json
Manifest: [{"path":"report.txt","source":"saffire-report","investigation":"saffire1","title":"Report","first_page":1}]
Separate pages with form-feed (pdftotext default). Output is replaced atomically after validation.
"""
import sys,json,pathlib,hashlib,re
root=pathlib.Path(__file__).resolve().parents[1]
manifest=json.loads(pathlib.Path(sys.argv[1]).read_text())
known_sources=set(re.findall(r"id:'([^']+)'",(root/'data/catalogue.mjs').read_text().split('const base')[0]))
known_investigations={'bass','bass2','saffire1','saffire2','saffire3','same','same-r','flex','acme','daft'}
rows=[]
for doc in manifest:
    if doc['source'] not in known_sources or doc['investigation'] not in known_investigations:raise ValueError('Unknown source or investigation')
    path=pathlib.Path(doc['path']);raw=path.read_bytes();digest=hashlib.sha256(raw).hexdigest()
    for page,text in enumerate(raw.decode('utf-8').split('\f'),doc.get('first_page',1)):
        text=' '.join(text.split())
        for offset in range(0,len(text),1400):
            chunk=text[offset:offset+1600]
            if not chunk:continue
            rows.append(dict(id=f"{doc['source']}-{doc['investigation']}-p{page}-{offset}",investigation=doc['investigation'],source=doc['source'],title=doc['title'],location=f'PDF page {page}',page=page,text=chunk,kind='Extracted source text; interpretation not verified',source_sha256=digest))
(root/'data/document-passages.mjs').write_text('export const documentPassages = '+json.dumps(rows,ensure_ascii=False,indent=2)+';\n')
print(f'Indexed {len(rows)} source passages. Rebuild and review extraction before using as findings.')
