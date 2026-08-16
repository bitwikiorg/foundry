const SEGMENT=/^[A-Za-z0-9_.-]+$/;
const SHA=/^[0-9a-f]{7,64}$/i;

function safeArtifact(path){
  if(typeof path!=='string'||!path||path.length>240||path.includes('..')||path.startsWith('/')||path.includes('\\'))return false;
  if(path==='README.md'||path==='navigation.json'||path==='graph.json'||path==='scorecard.json'||path==='manifest.json'||path==='llms.txt'||path==='llms-full.txt')return true;
  if(/^docs\/[A-Za-z0-9_.\/-]+\.md$/.test(path))return true;
  if(path==='visuals/index.json')return true;
  if(/^visuals\/views\/[a-z0-9][a-z0-9-]*\.json$/.test(path))return true;
  return false;
}

function contentType(path){
  if(path.endsWith('.json'))return 'application/json; charset=utf-8';
  if(path.endsWith('.md'))return 'text/markdown; charset=utf-8';
  if(path.endsWith('.txt'))return 'text/plain; charset=utf-8';
  return 'application/octet-stream';
}

export default async function handler(req,res){
  if(req.method!=='GET'){
    res.setHeader('Allow','GET');
    return res.status(405).json({ok:false,message:'Method not allowed.'});
  }

  const owner=String(req.query.owner||'');
  const repo=String(req.query.repo||'');
  const sha=String(req.query.sha||'');
  const path=String(req.query.path||'');

  if(!SEGMENT.test(owner)||!SEGMENT.test(repo)||!SHA.test(sha)||!safeArtifact(path)){
    return res.status(400).json({ok:false,message:'Invalid Atlas artifact request.'});
  }

  const artifactPath=['repos',owner,repo,'versions',sha,...path.split('/')].map(encodeURIComponent).join('/');
  const url=`https://raw.githubusercontent.com/bitwikiorg/atlas/main/${artifactPath}`;

  try{
    const upstream=await fetch(url,{headers:{'user-agent':'BITwiki-Foundry'}});
    if(!upstream.ok){
      return res.status(upstream.status===404?404:502).json({ok:false,message:upstream.status===404?'Atlas artifact not found.':'Atlas artifact unavailable.'});
    }
    const body=await upstream.arrayBuffer();
    res.setHeader('Content-Type',contentType(path));
    res.setHeader('Cache-Control','public, s-maxage=300, stale-while-revalidate=3600');
    res.setHeader('X-Content-Type-Options','nosniff');
    return res.status(200).send(Buffer.from(body));
  }catch{
    return res.status(502).json({ok:false,message:'Atlas artifact unavailable.'});
  }
}
