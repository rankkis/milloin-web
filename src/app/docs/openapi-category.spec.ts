import { openApiForCategory } from './openapi-category';

describe('openApiForCategory', () => {
  const ref = (name: string) => ({ $ref: `#/components/schemas/${name}` });
  const document = {
    openapi: '3.0.0',
    info: { title: 'milloin.xyz API' },
    tags: [{ name: 'prices' }, { name: 'plans' }, { name: 'ence' }],
    paths: {
      '/v1/electricity/prices': {
        get: {
          tags: ['prices'],
          responses: {
            200: {
              content: { 'application/json': { schema: ref('PricesDto') } },
            },
          },
        },
      },
      '/v1/electricity/plans/search': {
        post: {
          tags: ['plans'],
          requestBody: {
            content: { 'application/json': { schema: ref('PlanSearchDto') } },
          },
        },
      },
      '/v1/misc/ence': {
        get: {
          tags: ['ence'],
          responses: {
            200: {
              content: { 'application/json': { schema: ref('EnceDto') } },
            },
          },
        },
      },
      '/v1/miscellany': { get: { tags: ['ence'] } },
    },
    components: {
      schemas: {
        PricesDto: {
          properties: { prices: { type: 'array', items: ref('PriceDto') } },
        },
        PriceDto: { properties: { price: { type: 'number' } } },
        PlanSearchDto: { properties: { price: { allOf: [ref('PriceDto')] } } },
        EnceDto: { properties: { team: ref('EnceTeamDto') } },
        EnceTeamDto: { properties: { name: { type: 'string' } } },
      },
    },
  };

  it("keeps a category's paths, the tags they use and the schemas they refer to", () => {
    const electricity = openApiForCategory(document, '/v1/electricity');

    expect(Object.keys(electricity.paths)).toEqual(['/v1/electricity/prices', '/v1/electricity/plans/search']);
    expect(electricity.tags).toEqual([{ name: 'prices' }, { name: 'plans' }]);
    expect(Object.keys(electricity.components.schemas).sort()).toEqual(['PlanSearchDto', 'PriceDto', 'PricesDto']);
    expect(electricity.info).toEqual(document.info);
  });

  it('matches whole path segments only', () => {
    const misc = openApiForCategory(document, '/v1/misc');

    expect(Object.keys(misc.paths)).toEqual(['/v1/misc/ence']);
    expect(Object.keys(misc.components.schemas).sort()).toEqual(['EnceDto', 'EnceTeamDto']);
  });

  it('leaves the given document as it was', () => {
    openApiForCategory(document, '/v1/misc');

    expect(Object.keys(document.paths).length).toBe(4);
    expect(Object.keys(document.components.schemas).length).toBe(5);
  });
});
