const {test}=require('node:test');
const assert=require('node:assert/strict');
const {read}=require('../web/stream.js');
function response(text,chunkSize=1){const bytes=new TextEncoder().encode(text);return new Response(new ReadableStream({start(c){for(let i=0;i<bytes.length;i+=chunkSize)c.enqueue(bytes.slice(i,i+chunkSize));c.close();}}));}
test('SSE parser handles split UTF-8, CRLF and incrementally displays text',async()=>{const seen=[];const text=await read(response('data: {"response":"Impresión "}\r\n\r\ndata: {"response":"flexográfica"}\r\n\r\ndata: [DONE]\r\n\r\n'),part=>seen.push(part));assert.equal(text,'Impresión flexográfica');assert.equal(seen[0],'Impresión ');assert.equal(seen.at(-1),text);});
test('truncated and malformed responses fail instead of claiming a saved answer',async()=>{for(const input of ['data: {"response":"Partial"}\n\n','data: bad-json\n\n','data: {"error":"failed"}\n\n','data: [DONE]\n\n'])await assert.rejects(read(response(input),()=>{}));});
