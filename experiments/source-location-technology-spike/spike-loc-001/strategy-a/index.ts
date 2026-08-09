import { runStrategy } from '../shared/evaluate.js'
import { yamlAdapter } from '../shared/yaml-adapter.js'
await runStrategy({ id:'strategy-a', definition:'yaml@2.8.3 for YAML and JSON', yaml:yamlAdapter, json:yamlAdapter,
  scores:{sourceFidelity:5,malformedRecovery:4,yamlCorrectness:5,jsonFidelity:3,pointerSuitability:5,performanceMemory:4,typescriptNode:5,crossPlatform:5,apiMaintenance:5,licenseSecurityDependencies:5},
  operational:{pureJavaScript:true,nativeBuild:false,license:'ISC',syncApi:true,esm:true,typescriptDeclarations:true,strictJsonLimitation:'YAML grammar accepts JSON extensions; independent JSON.parse validation is required.',publicApis:['parseAllDocuments','parseDocument','LineCounter','Node.range','isMap','isSeq','isScalar']} })
