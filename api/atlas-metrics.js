const PROJECT_ID='prj_tiivx0FNkw7xabkLcAYSdP1WUHwU';
const TEAM_SLUG='bitwikiorgs-projects';
const ANALYTICS_START='2026-08-14T00:00:00.000Z';

function asNumber(row){for(const k of ['pageviews','count','visits','value'])if(Number.isFinite(Number(row?.[k])))return Number(row[k]);return 0}
function pathOf(row){return String(row?.requestPath??row?.request_path??row?.path??'')}

export default async function handler(req,res){
  if(req.method!=='GET'){res.setHeader('Allow','GET');return res.status(405).json({ok:false,message:'Method not allowed.'})}
  const token=process.env.VERCEL_ANALYTICS_TOKEN||process.env.VERCEL_TOKEN;
  if(!token){res.setHeader('Cache-Control','public, s-maxage=60, stale-while-revalidate=300');return res.status(200).json({enabled:false,total_atlas_pageviews:null,by_repo:{},reason:'analytics_token_not_configured'})}
  const params=new URLSearchParams({projectId:PROJECT_ID,slug:TEAM_SLUG,since:ANALYTICS_START,until:new Date().toISOString(),by:'requestPath',limit:'100'});
  try{
    const upstream=await fetch(`https://api.vercel.com/v1/query/web-analytics/visits/aggregate?${params}`,{headers:{authorization:`Bearer ${token}`,'user-agent':'BITwiki-Foundry'}});
    if(!upstream.ok){const body=await upstream.text().catch(()=> '');console.error('Atlas analytics query failed',{status:upstream.status,body:body.slice(0,500)});return res.status(200).json({enabled:false,total_atlas_pageviews:null,by_repo:{},reason:'analytics_query_failed'})}
    const payload=await upstream.json(),rows=Array.isArray(payload?.data)?payload.data:[],by_repo={};let total=0;
    for(const row of rows){const path=pathOf(row),match=path.match(/^\/atlas\/([^/]+)\/([^/?#]+)\/?$/i);if(!match)continue;const repo_id=`${decodeURIComponent(match[1])}/${decodeURIComponent(match[2])}`.toLowerCase(),pageviews=asNumber(row),visitors=Number.isFinite(Number(row?.visitors))?Number(row.visitors):null;total+=pageviews;by_repo[repo_id]={pageviews,visitors}}
    res.setHeader('Cache-Control','public, s-maxage=60, stale-while-revalidate=300');return res.status(200).json({enabled:true,total_atlas_pageviews:total,by_repo})
  }catch(err){console.error('Atlas analytics unavailable',{message:String(err?.message||err)});return res.status(200).json({enabled:false,total_atlas_pageviews:null,by_repo:{},reason:'analytics_unavailable'})}
}
