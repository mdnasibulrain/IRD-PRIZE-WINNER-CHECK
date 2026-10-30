const IRD_API = 'https://prize.ird.gov.np/api/v1/public/winners';
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const cors = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=120'
    };
    if (request.method === 'OPTIONS') return new Response(null, {headers:cors});
    if (url.pathname === '/api/health') return Response.json({ok:true,service:'IRD Prize Winner Checker',source:IRD_API},{headers:cors});
    if (url.pathname !== '/api/winners') return new Response('Not found',{status:404});
    if (request.method !== 'GET') return Response.json({ok:false,error:'Method not allowed'},{status:405,headers:cors});
    try {
      const cache = caches.default;
      const cacheKey = new Request(url.origin + '/api/winners?cache=public-v1');
      let cached = await cache.match(cacheKey);
      if (cached) return new Response(cached.body,{status:200,headers:cors});
      let offset=0, limit=100, total=Infinity, draws=[];
      // IRD public endpoint is paginated by draw, not by individual coupon.
      for(let page=0; page<30 && offset<total; page++) {
        const upstream = new URL(IRD_API);
        upstream.searchParams.set('limit',String(limit));
        upstream.searchParams.set('offset',String(offset));
        const response = await fetch(upstream.toString(), {headers:{'Accept':'application/json'},cf:{cacheTtl:120,cacheEverything:true}});
        if(!response.ok) throw new Error('IRD public API returned HTTP '+response.status);
        const json = await response.json();
        if(!Array.isArray(json.draws)) throw new Error('Unexpected IRD API response format');
        draws.push(...json.draws);
        total = Number(json.total_draws ?? draws.length);
        const actualLimit = Number(json.limit ?? limit);
        const actualOffset = Number(json.offset ?? offset);
        if(json.draws.length===0) break;
        offset = actualOffset + actualLimit;
      }
      const winners=[];
      for(const draw of draws) {
        for(const w of (Array.isArray(draw.winners)?draw.winners:[])) {
          if(!w.prize_coupon_number) continue;
          winners.push({coupon:String(w.prize_coupon_number),rank:w.winner_rank??null,category:draw.category_title_en||draw.category_title_ne||'',drawTitle:draw.title_en||draw.title_ne||'',eligibleFrom:draw.eligible_from||'',eligibleTo:draw.eligible_to||'',publishedAt:draw.published_at||'',claimDeadline:draw.claim_deadline||'',drawId:draw.draw_id||'',fiscalYear:w.prize_fiscal_year_code||''});
        }
      }
      const body={ok:true,source:'IRD public winners API',fetchedAt:new Date().toISOString(),totalDraws:draws.length,totalWinners:winners.length,winners};
      const response=Response.json(body,{headers:cors});
      ctx.waitUntil(cache.put(cacheKey,response.clone()));
      return response;
    } catch(error) {
      return Response.json({ok:false,error:'IRD बाट सार्वजनिक नतिजा प्राप्त गर्न सकिएन। '+error.message},{status:502,headers:{...cors,'Cache-Control':'no-store'}});
    }
  }
};
