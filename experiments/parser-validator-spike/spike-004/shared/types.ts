export type Status = 'PASS'|'PARTIAL'|'FAIL'|'NOT_SUPPORTED'|'NOT_APPLICABLE'
export interface OperationEvidence { path:string; sourceKind:'fixed'|'additional'; declaredFieldOrKey:string; httpMethod:string; operationId?:string; parameterCount:number; pathParameterCount:number; hasRequestBody:boolean; requestBodyContentKeys:string[]; responseKeys:string[]; responseSummaries:string[]; querystringParameters:number; nestedSchemasReachable:boolean; sourcePointer:string; sourceDocumentUri?:string; candidatePath?:string[] }
export interface RepresentationEvidence { mode:'raw'|'bundle'|'traversal'; status:Status; declaredVersion?:string; operations:OperationEvidence[]; diagnostics:unknown[]; rawFields?:Record<string,unknown>; notes:string[] }
export type Plain = Record<string,unknown>
export const fixed32 = ['get','put','post','delete','options','head','patch','trace','query'] as const
export const fixedLegacy = fixed32.slice(0,8)
export function object(value:unknown):Plain { return value && typeof value==='object' ? value as Plain : {} }
export function encode(segment:string) { return segment.replaceAll('~','~0').replaceAll('/','~1') }
export function discover(document:unknown, versionAware=true, sourceDocumentUri?:string):OperationEvidence[] {
  const root=object(document), version=String(root.openapi??''), fields=versionAware && version.startsWith('3.2') ? fixed32 : fixedLegacy
  const found:OperationEvidence[]=[]
  for(const [path,pathItemValue] of Object.entries(object(root.paths))) {
    const pathItem=object(pathItemValue), pathParameters=Array.isArray(pathItem.parameters)?pathItem.parameters.length:0
    for(const field of fields) if(pathItem[field] && typeof pathItem[field]==='object') found.push(toEvidence(path,'fixed',field,field.toUpperCase(),object(pathItem[field]),pathParameters,sourceDocumentUri))
    if(versionAware && version.startsWith('3.2')) for(const [method,value] of Object.entries(object(pathItem.additionalOperations))) if(value && typeof value==='object') found.push(toEvidence(path,'additional',method,method,object(value),pathParameters,sourceDocumentUri))
  }
  return found
}
function toEvidence(path:string,kind:'fixed'|'additional',key:string,method:string,operation:Plain,pathParameterCount:number,sourceDocumentUri?:string):OperationEvidence {
  const parameters=Array.isArray(operation.parameters)?operation.parameters:[], responses=object(operation.responses), requestBody=object(operation.requestBody)
  return {path,sourceKind:kind,declaredFieldOrKey:key,httpMethod:method,operationId:typeof operation.operationId==='string'?operation.operationId:undefined,
    parameterCount:parameters.length,pathParameterCount,hasRequestBody:Object.keys(requestBody).length>0,requestBodyContentKeys:Object.keys(object(requestBody.content)),
    responseKeys:Object.keys(responses),responseSummaries:Object.values(responses).map(v=>object(v).summary).filter((v):v is string=>typeof v==='string'),
    querystringParameters:parameters.filter(v=>object(v).in==='querystring').length,nestedSchemasReachable:JSON.stringify(operation).includes('schema'),
    sourcePointer:`/paths/${encode(path)}/${kind==='fixed'?key:`additionalOperations/${encode(key)}`}`,sourceDocumentUri}
}
