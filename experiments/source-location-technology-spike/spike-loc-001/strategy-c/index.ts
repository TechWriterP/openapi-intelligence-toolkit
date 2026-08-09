import { runStrategy } from '../shared/evaluate.js'
import { treeSitterAdapter } from '../shared/tree-sitter-adapter.js'
await runStrategy({ id:'strategy-c', definition:'tree-sitter@0.21.1 + YAML grammar@0.6.1 + JSON grammar@0.24.8', yaml:treeSitterAdapter, json:treeSitterAdapter,
  scores:{sourceFidelity:5,malformedRecovery:5,yamlCorrectness:4,jsonFidelity:5,pointerSuitability:4,performanceMemory:3,typescriptNode:4,crossPlatform:2,apiMaintenance:3,licenseSecurityDependencies:3},
  operational:{pureJavaScript:false,nativeBuild:true,licenses:{treeSitter:'MIT',yamlGrammar:'MIT',jsonGrammar:'MIT'},syncApi:true,esmInterop:'CommonJS default imports under NodeNext',typescriptDeclarations:true,
    nativeRisk:'tree-sitter uses Node-API native bindings, node-gyp-build and platform prebuilds; Linux/Windows feasibility inferred, not executed.',
    compatibilityEvidence:'Latest YAML grammar 0.7.1 requires tree-sitter ^0.22.4 while JSON grammar 0.24.8 requires ^0.21.1. YAML grammar 0.6.1 also requires ^0.21.1, establishing runtime 0.21.1 as the compatible intersection.',
    publicApis:['Parser','setLanguage','parse','Tree.rootNode','SyntaxNode fields and traversal methods']} })
