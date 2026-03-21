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
          headline: { type: 'string' },
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
          technologies: { type: 'array', items: { type: 'string' } },
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
      Project: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          date: { type: 'string' },
          description: { type: 'string' },
          technologies: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                iconClass: { type: 'string' },
                iconImage: { type: 'string' },
              },
            },
          },
          url: { type: 'string' },
          githubUrl: { type: 'string' },
        },
      },
      Skill: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          iconClass: { type: 'string' },
          iconImage: { type: 'string' },
          category: {
            type: 'string',
            enum: [
              'Programming Languages',
              'Web/Cross Platform Framework & Libraries',
              'DevOps Tools',
              'Databases',
              'Cloud Platforms',
              'Data/AI Framework & Libraries',
            ],
          },
          proficiency: { type: 'string' },
          isShow: { type: 'boolean' },
        },
      },
      Resume: {
        type: 'object',
        properties: {
          experiences: { type: 'array', items: { $ref: '#/components/schemas/Experience' } },
          skills: { type: 'array', items: { $ref: '#/components/schemas/Skill' } },
          projects: { type: 'array', items: { $ref: '#/components/schemas/Project' } },
          educations: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                institution: { type: 'string' },
                degree: { type: 'string' },
                field: { type: 'string' },
                startDate: { type: 'string', format: 'date', example: '2025-01-15' },
                endDate: { type: 'string', format: 'date', example: '2025-01-15' },
              },
            },
          },
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
