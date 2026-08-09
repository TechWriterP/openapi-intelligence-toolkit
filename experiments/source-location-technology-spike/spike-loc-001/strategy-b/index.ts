import { runStrategy } from '../shared/evaluate.js'
import { yamlAdapter } from '../shared/yaml-adapter.js'
import { jsoncAdapter } from '../shared/jsonc-adapter.js'
await runStrategy({ id:'strategy-b', definition:'yaml@2.8.3 for YAML; jsonc-parser@3.3.1 for strict JSON', yaml:yamlAdapter, json:jsoncAdapter,
  scores:{sourceFidelity:5,malformedRecovery:4,yamlCorrectness:5,jsonFidelity:5,pointerSuitability:5,performanceMemory:5,typescriptNode:5,crossPlatform:5,apiMaintenance:5,licenseSecurityDependencies:5},
  operational:{pureJavaScript:true,nativeBuild:false,licenses:{yaml:'ISC','jsonc-parser':'MIT'},syncApi:true,esm:true,typescriptDeclarations:true,
    jsonMode:{disallowComments:true,allowTrailingComma:false,allowEmptyContent:false},publicApis:{yaml:['parseAllDocuments','LineCounter','Node.range'],jsoncParser:['parseTree','Node.offset','Node.length','ParseError']}} })
