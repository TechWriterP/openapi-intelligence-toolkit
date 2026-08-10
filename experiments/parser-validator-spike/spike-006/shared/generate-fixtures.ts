import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import YAML from 'yaml';

const root = new URL('../', import.meta.url).pathname;
const parameter = { name: 'petId', in: 'path', required: true, schema: { type: 'string' } };
function base(openapi: string): any {
  return { openapi, info: { title: 'OAIT Validator Spike API', version: '1.0.0' }, paths: { '/pets/{petId}': { get: { operationId: 'getPet', parameters: [structuredClone(parameter)], responses: { '200': { description: 'OK' } }, security: [{ ApiKeyAuth: [] }] } } }, components: { schemas: { Pet: { type: 'object', required: ['id'], properties: { id: { type: 'string' } } } }, securitySchemes: { ApiKeyAuth: { type: 'apiKey', in: 'header', name: 'X-API-Key' } } } };
}
const cases: Array<[string,string,any]> = [];
const add=(id:string,path:string,doc:any)=>cases.push([id,path,doc]);
for (const v of ['3.0.4','3.1.2','3.2.0']) add(`V1-${v}`,`valid/oas-${v}.yaml`,base(v));
for (const v of ['3.0.4','3.1.2','3.2.0']) { const d=base(v); delete d.info; add(`V2-${v}`,`root/v2-missing-info-${v}.yaml`,d); }
{const d=base('3.1.2');delete d.info.title;add('V3-title','root/v3-missing-title.yaml',d)}
{const d=base('3.1.2');delete d.info.version;add('V3-version','root/v3-missing-version.yaml',d)}
{const d=base('3.0.4');delete d.paths;add('V4-3.0','root/v4-oas30-missing-paths.yaml',d)}
for(const v of ['3.1.2','3.2.0']){const d=base(v);delete d.paths;add(`V4-${v}`,`root/v4-components-only-${v}.yaml`,d)}
{const d=base('3.1.2');d.paths['/pets/{petId}'].get.parameters=[];add('V5','parameters/v5-template-missing.yaml',d)}
{const d=base('3.1.2');d.paths['/pets/{petId}'].get.parameters[0].name='petID';add('V6','parameters/v6-template-similar.yaml',d)}
{const d=base('3.1.2');d.paths['/pets/{petId}'].get.parameters[0].required=false;add('V7','parameters/v7-required-false.yaml',d)}
{const d=base('3.1.2');delete d.paths['/pets/{petId}'].get.parameters[0].required;add('V8','parameters/v8-required-missing.yaml',d)}
{const d=base('3.1.2');d.paths['/pets/{petId}'].get.parameters.push({name:'q',in:'query'});add('V9','parameters/v9-neither-schema-content.yaml',d)}
{const d=base('3.1.2');d.paths['/pets/{petId}'].get.parameters.push({name:'q',in:'query',schema:{type:'string'},content:{'text/plain':{schema:{type:'string'}}}});add('V10','parameters/v10-both-schema-content.yaml',d)}
{const d=base('3.1.2');d.paths['/pets/{petId}'].get.parameters.push({name:'q',in:'query',schema:{type:'string'}},{name:'q',in:'query',schema:{type:'integer'}});add('V11','parameters/v11-duplicate.yaml',d)}
{const d=base('3.1.2');d.paths['/pets/{petId}'].parameters=[structuredClone(parameter)];d.paths['/pets/{petId}'].get.parameters=[{...structuredClone(parameter),description:'override'}];add('V12','parameters/v12-valid-override.yaml',d)}
{const d=base('3.1.2');d.components.schemas.Broken={$ref:'#/components/schemas/DoesNotExist'};add('V13','references/v13-missing-internal.yaml',d)}
{const d=base('3.1.2');d.components.schemas.Broken={$ref:'./does-not-exist.yaml#/Broken'};add('V14','references/v14-missing-file.yaml',d)}
{const d=base('3.1.2');d.components.schemas.Node={type:'object',properties:{child:{$ref:'#/components/schemas/Node'}}};add('V15','references/v15-recursive.yaml',d)}
for(const v of ['3.0.4','3.1.2','3.2.0']){const d=base(v);d.paths['/pets/{petId}'].get.responses={};add(`V16-${v}`,`responses/v16-empty-${v}.yaml`,d)}
{const d=base('3.0.4');delete d.paths['/pets/{petId}'].get.responses;add('V17','responses/v17-oas30-missing.yaml',d)}
for(const v of ['3.1.2','3.2.0']){const d=base(v);delete d.paths['/pets/{petId}'].get.responses;add(`V18-${v}`,`responses/v18-missing-${v}.yaml`,d)}
for(const [id,v] of [['V19','3.0.4'],['V20','3.1.2'],['V21','3.2.0']]){const d=base(v);d.paths['/pets/{petId}'].get.responses={'200':{}};add(id,`responses/${id.toLowerCase()}-missing-description.yaml`,d)}
{const d=base('3.1.2');d.paths['/animals']={get:{operationId:'getPet',responses:{'200':{description:'OK'}}}};add('V22','operations/v22-duplicate-operation-id.yaml',d)}
{const d=base('3.1.2');d.paths['/animals']={get:{operationId:'GetPet',responses:{'200':{description:'OK'}}}};add('V23','operations/v23-case-sensitive.yaml',d)}
{const d=base('3.1.2');d.paths['/pets/{petId}'].get.security=[{missingScheme:[]}];add('V24','security/v24-undeclared.yaml',d)}
add('V25','security/v25-declared.yaml',base('3.1.2'));
{const d=base('3.2.0');d.paths['/search']={query:{operationId:'search',responses:{'200':{description:'OK'}}}};add('V26','version-awareness/v26-query.yaml',d)}
{const d=base('3.2.0');d.paths['/pets/{petId}'].additionalOperations={COPY:{operationId:'copyPet',responses:{'200':{description:'OK'}}}};add('V27','version-awareness/v27-additional-operations.yaml',d)}
{const d=base('3.2.0');d.paths['/search']={query:{operationId:'search',parameters:[{name:'search',in:'querystring',content:{'application/x-www-form-urlencoded':{schema:{type:'object'}}}}],responses:{'200':{description:'OK'}}}};add('V28','version-awareness/v28-querystring.yaml',d)}
for(const [id,v] of [['V29','3.1.2'],['V30','3.2.0']]){const d=base(v);d.components.schemas.Allow=true;d.components.schemas.Deny=false;add(id,`version-awareness/${id.toLowerCase()}-boolean.yaml`,d)}
for(const v of ['3.1.2','3.2.0']){const d=base(v);d.components.schemas.Custom={type:'string',acmeQualityScore:42};add(`V31-${v}`,`version-awareness/v31-unknown-${v}.yaml`,d)}
{const d=base('3.0.4');d.components.schemas.Custom={type:'string',acmeQualityScore:42};add('V32','version-awareness/v32-unknown-3.0.4.yaml',d)}
{const d=base('3.1.2');d.components.schemas.External={$ref:'./schemas/external.yaml'};add('MF','multi-file/openapi.yaml',d)}
{const d=base('3.1.2');delete d.info;d.paths['/pets/{petId}'].get.parameters[0].required=false;d.paths['/pets/{petId}'].get.responses={};d.paths['/other']={get:{operationId:'getPet',responses:{'200':{description:'OK'}}}};add('MULTI','multi-error/multiple.yaml',d)}
for(const [,path,doc] of cases){const target=join(root,'fixtures',path);await mkdir(dirname(target),{recursive:true});await writeFile(target,YAML.stringify(doc), 'utf8')}
const external=join(root,'fixtures/multi-file/schemas/external.yaml');await mkdir(dirname(external),{recursive:true});await writeFile(external,YAML.stringify({type:'object',properties:{id:{type:'string'}},required:'id'}),'utf8');
console.log(`wrote ${cases.length + 1} fixture files`);
