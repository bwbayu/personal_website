import { config } from './env';

const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Personal Website API',
    version: '1.0.0',
    description: 'REST API for personal website portfolio data',
  },
  servers: [{ url: config.apiBaseUrl }],
  components: {
    securitySchemes: {
      ApiKeyAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'x-api-key',
      },
    },
    schemas: {
      About: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          email: { type: 'string' },
        },
      },
      Achievement: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          event_name: { type: 'string' },
          org_name: { type: 'string' },
          date: { type: 'string' },
          descriptions: { type: 'array', items: { type: 'string' } },
          githubUrl: { type: 'array', items: { type: 'string' } },
          resultUrl: { type: 'array', items: { type: 'string' } },
        },
      },
      Category: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          order: { type: 'integer' },
        },
      },
      Certification: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          company_name: { type: 'string' },
          title: { type: 'string' },
          issued: { type: 'string' },
          expires: { type: 'string' },
          url: { type: 'string' },
        },
      },
      Education: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          institution: { type: 'string' },
          title: { type: 'string' },
          startDate: { type: 'string' },
          endDate: { type: 'string' },
          description: { type: 'string' },
        },
      },
      Experience: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          company: { type: 'string' },
          position: { type: 'string' },
          description: { type: 'array', items: { type: 'string' } },
          location: { type: 'string' },
          startDate: { type: 'string', format: 'date', example: '2025-01-15' },
          endDate: { type: 'string', format: 'date', example: '2025-01-15' },
        },
      },
      MediaSocial: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          url: { type: 'string' },
          iconClass: { type: 'string' },
        },
      },
      Post: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          slug: { type: 'string' },
          title: { type: 'string' },
          excerpt: { type: 'string' },
          cover: { type: 'string' },
          content: { type: 'string' },
          tags: { type: 'array', items: { type: 'string' } },
          status: { type: 'string', enum: ['draft', 'published'] },
          publishedAt: { type: 'string' },
          readingTime: { type: 'integer' },
        },
      },
      Project: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          date: { type: 'string' },
          description: { type: 'string' },
          technologies: {
            type: 'array',
            items: { type: 'string' },
          },
          url: { type: 'string' },
          githubUrl: { type: 'string' },
          youtubeUrl: { type: 'string' },
        },
      },
      Skill: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          iconClass: { type: 'string' },
          iconImage: { type: 'string' },
          categoryId: { type: 'string' },
          order: { type: 'integer' },
          isShow: { type: 'boolean' },
        },
      },
      Resume: {
        type: 'object',
        properties: {
          educations: { type: 'array', items: { $ref: '#/components/schemas/Education' } },
          experiences: { type: 'array', items: { $ref: '#/components/schemas/Experience' } },
          certifications: { type: 'array', items: { $ref: '#/components/schemas/Certification' } },
          achievements: { type: 'array', items: { $ref: '#/components/schemas/Achievement' } },
        },
      },
      SuccessResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string' },
          data: {},
        },
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string' },
        },
      },
    },
  },
  paths: {
    '/api/about': {
      get: {
        tags: ['About'],
        summary: 'Get about info',
        responses: {
          '200': { description: 'Success', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } },
        },
      },
    },
    '/api/about/{id}': {
      patch: {
        tags: ['About'],
        summary: 'Update about info',
        security: [{ ApiKeyAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/About' } } } },
        responses: {
          '200': { description: 'Updated', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } },
        },
      },
    },
    '/api/achievements': {
      get: {
        tags: ['Achievements'],
        summary: 'Get all achievements',
        responses: {
          '200': { description: 'Success', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } },
        },
      },
      post: {
        tags: ['Achievements'],
        summary: 'Create an achievement',
        security: [{ ApiKeyAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Achievement' } } } },
        responses: {
          '201': { description: 'Created', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } },
        },
      },
    },
    '/api/achievements/{id}': {
      patch: {
        tags: ['Achievements'],
        summary: 'Update an achievement',
        security: [{ ApiKeyAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Achievement' } } } },
        responses: {
          '200': { description: 'Updated', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } },
        },
      },
      delete: {
        tags: ['Achievements'],
        summary: 'Delete an achievement',
        security: [{ ApiKeyAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Deleted', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } },
        },
      },
    },
    '/api/categories': {
      get: {
        tags: ['Categories'],
        summary: 'Get all categories',
        responses: {
          '200': { description: 'Success', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } },
        },
      },
      post: {
        tags: ['Categories'],
        summary: 'Create a category',
        security: [{ ApiKeyAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Category' } } } },
        responses: {
          '201': { description: 'Created', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } },
        },
      },
    },
    '/api/categories/reorder': {
      patch: {
        tags: ['Categories'],
        summary: 'Reorder categories',
        security: [{ ApiKeyAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: { id: { type: 'string' }, order: { type: 'integer' } },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Reordered', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } },
        },
      },
    },
    '/api/categories/{id}': {
      patch: {
        tags: ['Categories'],
        summary: 'Update a category',
        security: [{ ApiKeyAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Category' } } } },
        responses: {
          '200': { description: 'Updated', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } },
        },
      },
      delete: {
        tags: ['Categories'],
        summary: 'Delete a category',
        security: [{ ApiKeyAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Deleted', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } },
        },
      },
    },
    '/api/certifications': {
      get: {
        tags: ['Certifications'],
        summary: 'Get all certifications',
        responses: {
          '200': { description: 'Success', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } },
        },
      },
      post: {
        tags: ['Certifications'],
        summary: 'Create a certification',
        security: [{ ApiKeyAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Certification' } } } },
        responses: {
          '201': { description: 'Created', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } },
        },
      },
    },
    '/api/certifications/{id}': {
      patch: {
        tags: ['Certifications'],
        summary: 'Update a certification',
        security: [{ ApiKeyAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Certification' } } } },
        responses: {
          '200': { description: 'Updated', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } },
        },
      },
      delete: {
        tags: ['Certifications'],
        summary: 'Delete a certification',
        security: [{ ApiKeyAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Deleted', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } },
        },
      },
    },
    '/api/educations': {
      get: {
        tags: ['Educations'],
        summary: 'Get all educations',
        responses: {
          '200': { description: 'Success', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } },
        },
      },
      post: {
        tags: ['Educations'],
        summary: 'Create an education entry',
        security: [{ ApiKeyAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Education' } } } },
        responses: {
          '201': { description: 'Created', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } },
        },
      },
    },
    '/api/educations/{id}': {
      patch: {
        tags: ['Educations'],
        summary: 'Update an education entry',
        security: [{ ApiKeyAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Education' } } } },
        responses: {
          '200': { description: 'Updated', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } },
        },
      },
      delete: {
        tags: ['Educations'],
        summary: 'Delete an education entry',
        security: [{ ApiKeyAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Deleted', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } },
        },
      },
    },
    '/api/experiences': {
      get: {
        tags: ['Experiences'],
        summary: 'Get all experiences',
        responses: {
          '200': { description: 'Success', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } },
        },
      },
      post: {
        tags: ['Experiences'],
        summary: 'Create an experience',
        security: [{ ApiKeyAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Experience' } } } },
        responses: {
          '201': { description: 'Created', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } },
        },
      },
    },
    '/api/experiences/{id}': {
      patch: {
        tags: ['Experiences'],
        summary: 'Update an experience',
        security: [{ ApiKeyAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Experience' } } } },
        responses: {
          '200': { description: 'Updated', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } },
        },
      },
      delete: {
        tags: ['Experiences'],
        summary: 'Delete an experience',
        security: [{ ApiKeyAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Deleted', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } },
        },
      },
    },
    '/api/media-socials': {
      get: {
        tags: ['Media Socials'],
        summary: 'Get all media socials',
        responses: {
          '200': { description: 'Success', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } },
        },
      },
      post: {
        tags: ['Media Socials'],
        summary: 'Create a media social',
        security: [{ ApiKeyAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/MediaSocial' } } } },
        responses: {
          '201': { description: 'Created', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } },
        },
      },
    },
    '/api/media-socials/{id}': {
      patch: {
        tags: ['Media Socials'],
        summary: 'Update a media social',
        security: [{ ApiKeyAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/MediaSocial' } } } },
        responses: {
          '200': { description: 'Updated', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } },
        },
      },
      delete: {
        tags: ['Media Socials'],
        summary: 'Delete a media social',
        security: [{ ApiKeyAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Deleted', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } },
        },
      },
    },
    '/api/posts': {
      get: {
        tags: ['Posts'],
        summary: 'Get all published posts',
        responses: {
          '200': { description: 'Success', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } },
        },
      },
      post: {
        tags: ['Posts'],
        summary: 'Create a post',
        security: [{ ApiKeyAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Post' } } } },
        responses: {
          '201': { description: 'Created', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } },
        },
      },
    },
    '/api/posts/all': {
      get: {
        tags: ['Posts'],
        summary: 'Get all posts including drafts',
        security: [{ ApiKeyAuth: [] }],
        responses: {
          '200': { description: 'Success', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } },
        },
      },
    },
    '/api/posts/{id}': {
      patch: {
        tags: ['Posts'],
        summary: 'Update a post',
        security: [{ ApiKeyAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Post' } } } },
        responses: {
          '200': { description: 'Updated', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } },
        },
      },
      delete: {
        tags: ['Posts'],
        summary: 'Delete a post',
        security: [{ ApiKeyAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Deleted', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } },
        },
      },
    },
    '/api/projects': {
      get: {
        tags: ['Projects'],
        summary: 'Get all projects',
        responses: {
          '200': { description: 'Success', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } },
        },
      },
      post: {
        tags: ['Projects'],
        summary: 'Create a project',
        security: [{ ApiKeyAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Project' } } } },
        responses: {
          '201': { description: 'Created', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } },
        },
      },
    },
    '/api/projects/{id}': {
      patch: {
        tags: ['Projects'],
        summary: 'Update a project',
        security: [{ ApiKeyAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Project' } } } },
        responses: {
          '200': { description: 'Updated', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } },
        },
      },
      delete: {
        tags: ['Projects'],
        summary: 'Delete a project',
        security: [{ ApiKeyAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Deleted', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } },
        },
      },
    },
    '/api/rebuild': {
      post: {
        tags: ['Rebuild'],
        summary: 'Trigger a site rebuild',
        security: [{ ApiKeyAuth: [] }],
        responses: {
          '202': { description: 'Accepted', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } },
        },
      },
    },
    '/api/resume': {
      get: {
        tags: ['Resume'],
        summary: 'Get full resume data',
        responses: {
          '200': { description: 'Success', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } },
        },
      },
    },
    '/api/skills': {
      get: {
        tags: ['Skills'],
        summary: 'Get all skills',
        responses: {
          '200': { description: 'Success', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } },
        },
      },
      post: {
        tags: ['Skills'],
        summary: 'Create a skill',
        security: [{ ApiKeyAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Skill' } } } },
        responses: {
          '201': { description: 'Created', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } },
        },
      },
    },
    '/api/skills/reorder': {
      patch: {
        tags: ['Skills'],
        summary: 'Reorder skills',
        security: [{ ApiKeyAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: { id: { type: 'string' }, order: { type: 'integer' } },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Reordered', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } },
        },
      },
    },
    '/api/skills/{id}': {
      patch: {
        tags: ['Skills'],
        summary: 'Update a skill',
        security: [{ ApiKeyAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Skill' } } } },
        responses: {
          '200': { description: 'Updated', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } },
        },
      },
      delete: {
        tags: ['Skills'],
        summary: 'Delete a skill',
        security: [{ ApiKeyAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Deleted', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } },
        },
      },
    },
  },
};

export default swaggerSpec;
