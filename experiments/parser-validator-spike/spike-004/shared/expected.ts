export const expectedCounts:Record<string,number>={
  'query-minimal.yaml':1,'all-fixed.yaml':9,'additional-operations.yaml':4,'mixed.yaml':5,'multiple-paths.yaml':6,'method-case.yaml':1,
  'path-parameters.yaml':3,'parameter-overrides.yaml':2,'querystring.yaml':1,'additional-querystring.yaml':1,'request-bodies.yaml':2,
  'response-summary.yaml':1,'operation-ids.yaml':4
}
export const expectedPointers=['/paths/~1search/query','/paths/~1pets~1{id}/additionalOperations/COPY','/paths/~1pets~1{id}/additionalOperations/PURGE','/paths/~1search/query/parameters/0','/paths/~1search/query/responses/200']
