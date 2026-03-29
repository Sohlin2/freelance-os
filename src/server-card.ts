/** MCP server card — auto-generated from live tools/list response */
export const serverCard = {
  "serverInfo": {
    "name": "freelance-os",
    "version": "0.1.0",
    "title": "FreelanceOS",
    "description": "AI-powered freelance business manager. Manage clients, proposals, invoices, time tracking, scope, and follow-ups \u2014 37 tools covering the full freelance lifecycle from lead to payment.",
    "websiteUrl": "https://github.com/Sohlin2/freelance-os",
    "icons": [
      {
        "src": "https://raw.githubusercontent.com/Sohlin2/freelance-os/main/logo.svg",
        "mimeType": "image/svg+xml"
      }
    ]
  },
  "authentication": {
    "required": true,
    "schemes": [
      "api-key"
    ]
  },
  "tools": [
    {
      "name": "create_client",
      "description": "Create a new client record in the FreelanceOS database. Use this tool whenever a freelancer mentions a new client they're starting to work with or want to begin tracking \u00e2\u20ac\u201d capturing contact details and default billing rate upfront saves time when creating projects and invoices later.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "name": {
            "type": "string",
            "minLength": 1,
            "description": "Full name or company name of the client (required)"
          },
          "email": {
            "description": "Primary email address used to contact this client",
            "type": "string",
            "format": "email",
            "pattern": "^(?!\\.)(?!.*\\.\\.)([A-Za-z0-9_'+\\-\\.]*)[A-Za-z0-9_+-]@([A-Za-z0-9][A-Za-z0-9\\-]*\\.)+[A-Za-z]{2,}$"
          },
          "phone": {
            "description": "Phone number for the client, including country code if international",
            "type": "string"
          },
          "company": {
            "description": "Company or organisation name if different from the individual contact name",
            "type": "string"
          },
          "billing_rate": {
            "description": "Default hourly billing rate for this client, used as the fallback when creating time entries and invoices",
            "type": "number",
            "exclusiveMinimum": 0
          },
          "currency": {
            "default": "USD",
            "description": "ISO 4217 three-letter currency code for all monetary amounts billed to this client (e.g. USD, EUR, GBP)",
            "type": "string",
            "minLength": 3,
            "maxLength": 3
          },
          "notes": {
            "description": "Free-form notes about this client such as communication preferences, contract terms, or background context",
            "type": "string"
          }
        },
        "required": [
          "name"
        ]
      },
      "annotations": {
        "title": "Create Client",
        "readOnlyHint": false,
        "destructiveHint": false,
        "idempotentHint": false,
        "openWorldHint": false
      }
    },
    {
      "name": "get_client",
      "description": "Retrieve the full profile for a single client, including all associated projects and follow-up communications. Use this tool when a freelancer asks about a specific client by name or ID, or when you need complete client context before drafting a proposal, invoice, or follow-up.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "client_id": {
            "type": "string",
            "format": "uuid",
            "pattern": "^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$",
            "description": "The unique identifier (UUID) of the client to retrieve"
          }
        },
        "required": [
          "client_id"
        ]
      },
      "annotations": {
        "title": "Get Client",
        "readOnlyHint": true,
        "destructiveHint": false,
        "idempotentHint": true,
        "openWorldHint": false
      }
    },
    {
      "name": "list_clients",
      "description": "List all active (non-archived) clients with optional name search, sorting, and pagination. Use this tool when a freelancer wants an overview of their client roster, needs to look up a client by name, or when you need to present a list of clients for the user to choose from.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "search": {
            "description": "Partial name string to filter clients by \u00e2\u20ac\u201d performs a case-insensitive substring match on the client name field",
            "type": "string"
          },
          "sort_by": {
            "default": "created_at",
            "description": "The client field to sort results by: name (alphabetical), created_at (when added), updated_at (recently modified), or billing_rate",
            "type": "string",
            "enum": [
              "name",
              "created_at",
              "updated_at",
              "billing_rate"
            ]
          },
          "sort_dir": {
            "default": "desc",
            "description": "Sort direction: asc for ascending (A\u00e2\u2020\u2019Z, oldest first) or desc for descending (Z\u00e2\u2020\u2019A, newest first)",
            "type": "string",
            "enum": [
              "asc",
              "desc"
            ]
          },
          "limit": {
            "default": 20,
            "description": "Maximum number of client records to return in a single response (1\u00e2\u20ac\u201c100)",
            "type": "integer",
            "minimum": 1,
            "maximum": 100
          },
          "offset": {
            "default": 0,
            "description": "Number of records to skip before returning results, used for paginating through large client lists",
            "type": "integer",
            "minimum": 0,
            "maximum": 9007199254740991
          }
        }
      },
      "annotations": {
        "title": "List Clients",
        "readOnlyHint": true,
        "destructiveHint": false,
        "idempotentHint": true,
        "openWorldHint": false
      }
    },
    {
      "name": "update_client",
      "description": "Update one or more fields on an existing client record. Use this tool when a freelancer wants to correct contact details, change a billing rate, update notes, or make any other modification to a client's stored information \u00e2\u20ac\u201d only the fields you provide will be changed, all others remain untouched.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "client_id": {
            "type": "string",
            "format": "uuid",
            "pattern": "^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$",
            "description": "The unique identifier (UUID) of the client record to update"
          },
          "name": {
            "description": "New full name or company name to replace the existing client name",
            "type": "string",
            "minLength": 1
          },
          "email": {
            "anyOf": [
              {
                "type": "string",
                "format": "email",
                "pattern": "^(?!\\.)(?!.*\\.\\.)([A-Za-z0-9_'+\\-\\.]*)[A-Za-z0-9_+-]@([A-Za-z0-9][A-Za-z0-9\\-]*\\.)+[A-Za-z]{2,}$"
              },
              {
                "type": "null"
              }
            ],
            "description": "New primary email address for the client, or null to clear it"
          },
          "phone": {
            "anyOf": [
              {
                "type": "string"
              },
              {
                "type": "null"
              }
            ],
            "description": "New phone number for the client, or null to clear it"
          },
          "company": {
            "anyOf": [
              {
                "type": "string"
              },
              {
                "type": "null"
              }
            ],
            "description": "New company or organisation name, or null to clear it"
          },
          "billing_rate": {
            "anyOf": [
              {
                "type": "number",
                "exclusiveMinimum": 0
              },
              {
                "type": "null"
              }
            ],
            "description": "New default hourly billing rate for this client, or null to clear it"
          },
          "currency": {
            "description": "New ISO 4217 three-letter currency code to use for this client's billing (e.g. USD, EUR, GBP)",
            "type": "string",
            "minLength": 3,
            "maxLength": 3
          },
          "notes": {
            "anyOf": [
              {
                "type": "string"
              },
              {
                "type": "null"
              }
            ],
            "description": "New free-form notes to replace the existing notes, or null to clear them"
          }
        },
        "required": [
          "client_id"
        ]
      },
      "annotations": {
        "title": "Update Client",
        "readOnlyHint": false,
        "destructiveHint": false,
        "idempotentHint": true,
        "openWorldHint": false
      }
    },
    {
      "name": "archive_client",
      "description": "Soft-delete a client by setting their archived_at timestamp, hiding them from all active client lists while preserving their full history. Use this tool when a freelancer is done working with a client and wants to retire the record \u00e2\u20ac\u201d the client and all linked projects, invoices, and follow-ups remain in the database and can be audited, but will no longer appear in normal queries.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "client_id": {
            "type": "string",
            "format": "uuid",
            "pattern": "^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$",
            "description": "The unique identifier (UUID) of the client to archive"
          }
        },
        "required": [
          "client_id"
        ]
      },
      "annotations": {
        "title": "Archive Client",
        "readOnlyHint": false,
        "destructiveHint": true,
        "idempotentHint": true,
        "openWorldHint": false
      }
    },
    {
      "name": "create_project",
      "description": "Create a new project linked to an existing client and persist it to the FreelanceOS database. Use this tool when a freelancer is starting new work for a client and needs to track budget, timeline, and status across the project lifecycle.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "client_id": {
            "type": "string",
            "format": "uuid",
            "pattern": "^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$",
            "description": "UUID of the client this project belongs to \u00e2\u20ac\u201d must reference an existing client record"
          },
          "name": {
            "type": "string",
            "minLength": 1,
            "description": "Short, descriptive project name used throughout the FreelanceOS interface"
          },
          "description": {
            "description": "Optional longer description summarising the scope and goals of this project",
            "type": "string"
          },
          "budget": {
            "description": "Total agreed budget for this project expressed as a positive number",
            "type": "number",
            "exclusiveMinimum": 0
          },
          "currency": {
            "default": "USD",
            "description": "Three-letter ISO 4217 currency code for the budget amount, e.g. USD, EUR, GBP",
            "type": "string",
            "minLength": 3,
            "maxLength": 3
          },
          "start_date": {
            "description": "Planned project start date in YYYY-MM-DD format, used for timeline reporting",
            "type": "string",
            "format": "date",
            "pattern": "^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))$"
          },
          "end_date": {
            "description": "Expected project end or delivery date in YYYY-MM-DD format",
            "type": "string",
            "format": "date",
            "pattern": "^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))$"
          }
        },
        "required": [
          "client_id",
          "name"
        ]
      },
      "annotations": {
        "title": "Create Project",
        "readOnlyHint": false,
        "destructiveHint": false,
        "idempotentHint": false,
        "openWorldHint": false
      }
    },
    {
      "name": "get_project",
      "description": "Retrieve full details for a single project, including the associated client name and contact information. Use this tool when a freelancer asks about a specific project's status, budget, or timeline.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "project_id": {
            "type": "string",
            "format": "uuid",
            "pattern": "^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$",
            "description": "Unique UUID identifier of the project record to retrieve"
          }
        },
        "required": [
          "project_id"
        ]
      },
      "annotations": {
        "title": "Get Project",
        "readOnlyHint": true,
        "destructiveHint": false,
        "idempotentHint": true,
        "openWorldHint": false
      }
    },
    {
      "name": "list_projects",
      "description": "List all non-archived projects with optional full-text search, status and client filters, sorting, and pagination. Use this tool when a freelancer wants an overview of their work portfolio or needs to locate a specific project by name or client.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "search": {
            "description": "Case-insensitive partial match applied to the project name field",
            "type": "string"
          },
          "status": {
            "description": "Filter results to only projects with this lifecycle status value",
            "type": "string",
            "enum": [
              "active",
              "paused",
              "completed"
            ]
          },
          "client_id": {
            "description": "Restrict results to projects belonging to this specific client UUID",
            "type": "string",
            "format": "uuid",
            "pattern": "^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$"
          },
          "sort_by": {
            "default": "created_at",
            "description": "Database column used to order the returned project rows",
            "type": "string",
            "enum": [
              "name",
              "created_at",
              "updated_at",
              "start_date",
              "budget"
            ]
          },
          "sort_dir": {
            "default": "desc",
            "description": "Sort direction: asc for oldest-first or lowest-first, desc for newest-first or highest-first",
            "type": "string",
            "enum": [
              "asc",
              "desc"
            ]
          },
          "limit": {
            "default": 20,
            "description": "Maximum number of project records to return in a single response, between 1 and 100",
            "type": "integer",
            "minimum": 1,
            "maximum": 100
          },
          "offset": {
            "default": 0,
            "description": "Zero-based index offset into the full result set used for paginating through large lists",
            "type": "integer",
            "minimum": 0,
            "maximum": 9007199254740991
          }
        }
      },
      "annotations": {
        "title": "List Projects",
        "readOnlyHint": true,
        "destructiveHint": false,
        "idempotentHint": true,
        "openWorldHint": false
      }
    },
    {
      "name": "update_project",
      "description": "Update one or more fields on an existing project record, including name, description, budget, dates, or lifecycle status. Use this tool when a freelancer wants to edit project details, revise the budget, adjust the timeline, or mark a project as paused or completed.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "project_id": {
            "type": "string",
            "format": "uuid",
            "pattern": "^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$",
            "description": "Unique UUID identifier of the project record to update"
          },
          "name": {
            "description": "Replacement name for the project, must be at least one character long",
            "type": "string",
            "minLength": 1
          },
          "description": {
            "anyOf": [
              {
                "type": "string"
              },
              {
                "type": "null"
              }
            ],
            "description": "Replacement description for the project scope and goals, or null to clear it"
          },
          "status": {
            "description": "New lifecycle status to assign: active, paused, or completed",
            "type": "string",
            "enum": [
              "active",
              "paused",
              "completed"
            ]
          },
          "budget": {
            "anyOf": [
              {
                "type": "number",
                "exclusiveMinimum": 0
              },
              {
                "type": "null"
              }
            ],
            "description": "Revised total budget amount expressed as a positive number, or null to clear it"
          },
          "currency": {
            "description": "Replacement three-letter ISO 4217 currency code for the budget field",
            "type": "string",
            "minLength": 3,
            "maxLength": 3
          },
          "start_date": {
            "anyOf": [
              {
                "type": "string",
                "format": "date",
                "pattern": "^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))$"
              },
              {
                "type": "null"
              }
            ],
            "description": "Revised project start date in YYYY-MM-DD format, or null to clear it"
          },
          "end_date": {
            "anyOf": [
              {
                "type": "string",
                "format": "date",
                "pattern": "^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))$"
              },
              {
                "type": "null"
              }
            ],
            "description": "Revised expected end date in YYYY-MM-DD format, or null to clear it"
          }
        },
        "required": [
          "project_id"
        ]
      },
      "annotations": {
        "title": "Update Project",
        "readOnlyHint": false,
        "destructiveHint": false,
        "idempotentHint": true,
        "openWorldHint": false
      }
    },
    {
      "name": "archive_project",
      "description": "Soft-delete a project by setting its archived_at timestamp, hiding it from all active project lists while preserving all historical data. Use this tool when a freelancer wants to close out a completed or cancelled project without permanently destroying its records.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "project_id": {
            "type": "string",
            "format": "uuid",
            "pattern": "^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$",
            "description": "Unique UUID identifier of the active project record to archive"
          }
        },
        "required": [
          "project_id"
        ]
      },
      "annotations": {
        "title": "Archive Project",
        "readOnlyHint": false,
        "destructiveHint": true,
        "idempotentHint": true,
        "openWorldHint": false
      }
    },
    {
      "name": "create_proposal",
      "description": "Store a new proposal for a project, capturing all relevant details such as title, deliverables, pricing, and expiry date. Use when the freelancer has drafted proposal content and wants to persist it to the database for tracking and future reference.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "client_id": {
            "type": "string",
            "format": "uuid",
            "pattern": "^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$",
            "description": "UUID of the client this proposal is being created for"
          },
          "project_id": {
            "type": "string",
            "format": "uuid",
            "pattern": "^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$",
            "description": "UUID of the project this proposal is scoped and billed against"
          },
          "title": {
            "type": "string",
            "minLength": 1,
            "description": "Short descriptive title that identifies the proposal at a glance"
          },
          "content": {
            "description": "Free-form proposal body describing deliverables, timeline, and terms",
            "type": "string"
          },
          "amount": {
            "description": "Total monetary value being proposed for the project engagement",
            "type": "number",
            "exclusiveMinimum": 0
          },
          "currency": {
            "default": "USD",
            "description": "Three-letter ISO 4217 currency code for the proposal amount",
            "type": "string",
            "minLength": 3,
            "maxLength": 3
          },
          "valid_until": {
            "description": "Expiry date after which the proposal is no longer valid (YYYY-MM-DD)",
            "type": "string",
            "format": "date",
            "pattern": "^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))$"
          }
        },
        "required": [
          "client_id",
          "project_id",
          "title"
        ]
      },
      "annotations": {
        "title": "Create Proposal",
        "readOnlyHint": false,
        "destructiveHint": false,
        "idempotentHint": false,
        "openWorldHint": false
      }
    },
    {
      "name": "get_proposal",
      "description": "Retrieve a single proposal by its unique identifier, returning all stored fields including status, amount, and content. Use when the freelancer asks to view, review, or reference the details of a specific proposal.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "proposal_id": {
            "type": "string",
            "format": "uuid",
            "pattern": "^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$",
            "description": "UUID of the proposal record to retrieve from the database"
          }
        },
        "required": [
          "proposal_id"
        ]
      },
      "annotations": {
        "title": "Get Proposal",
        "readOnlyHint": true,
        "destructiveHint": false,
        "idempotentHint": true,
        "openWorldHint": false
      }
    },
    {
      "name": "list_proposals",
      "description": "List proposals filtered by project, client, or status with support for sorting and pagination. Use when the freelancer asks for proposal history, wants to audit outstanding proposals, or needs to check the status of proposals sent to a client.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "project_id": {
            "description": "Narrow results to proposals belonging to this project UUID",
            "type": "string",
            "format": "uuid",
            "pattern": "^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$"
          },
          "client_id": {
            "description": "Narrow results to proposals associated with this client UUID",
            "type": "string",
            "format": "uuid",
            "pattern": "^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$"
          },
          "status": {
            "description": "Filter proposals to only those matching the given lifecycle status",
            "type": "string",
            "enum": [
              "draft",
              "sent",
              "accepted",
              "declined",
              "expired"
            ]
          },
          "sort_by": {
            "default": "created_at",
            "description": "Database column to use as the primary sort key for results",
            "type": "string",
            "enum": [
              "created_at",
              "updated_at",
              "amount",
              "title"
            ]
          },
          "sort_dir": {
            "default": "desc",
            "description": "Direction to sort results \u00e2\u20ac\u201d ascending or descending",
            "type": "string",
            "enum": [
              "asc",
              "desc"
            ]
          },
          "limit": {
            "default": 20,
            "description": "Maximum number of proposal records to return in this page",
            "type": "integer",
            "minimum": 1,
            "maximum": 100
          },
          "offset": {
            "default": 0,
            "description": "Number of records to skip for cursor-based pagination",
            "type": "integer",
            "minimum": 0,
            "maximum": 9007199254740991
          }
        }
      },
      "annotations": {
        "title": "List Proposals",
        "readOnlyHint": true,
        "destructiveHint": false,
        "idempotentHint": true,
        "openWorldHint": false
      }
    },
    {
      "name": "update_proposal",
      "description": "Update one or more fields on an existing proposal, including content, pricing, status, or key timestamps. Use when the freelancer wants to revise proposal details, mark it as sent, or record a client response without going through the full accept flow.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "proposal_id": {
            "type": "string",
            "format": "uuid",
            "pattern": "^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$",
            "description": "UUID of the proposal record that should be updated"
          },
          "title": {
            "description": "Replacement title to give the proposal a new descriptive name",
            "type": "string",
            "minLength": 1
          },
          "content": {
            "anyOf": [
              {
                "type": "string"
              },
              {
                "type": "null"
              }
            ],
            "description": "Replacement body text describing deliverables, scope, and terms"
          },
          "status": {
            "description": "New lifecycle status to assign to the proposal record",
            "type": "string",
            "enum": [
              "draft",
              "sent",
              "accepted",
              "declined",
              "expired"
            ]
          },
          "amount": {
            "anyOf": [
              {
                "type": "number",
                "exclusiveMinimum": 0
              },
              {
                "type": "null"
              }
            ],
            "description": "Revised total monetary value for the project engagement"
          },
          "currency": {
            "description": "Replacement three-letter ISO 4217 currency code for the amount",
            "type": "string",
            "minLength": 3,
            "maxLength": 3
          },
          "valid_until": {
            "anyOf": [
              {
                "type": "string",
                "format": "date",
                "pattern": "^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))$"
              },
              {
                "type": "null"
              }
            ],
            "description": "New expiry date after which the proposal is no longer valid (YYYY-MM-DD)"
          },
          "sent_at": {
            "anyOf": [
              {
                "type": "string",
                "format": "date-time",
                "pattern": "^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d(?:\\.\\d+)?)?(?:Z))$"
              },
              {
                "type": "null"
              }
            ],
            "description": "ISO 8601 timestamp recording when the proposal was delivered to the client"
          },
          "responded_at": {
            "anyOf": [
              {
                "type": "string",
                "format": "date-time",
                "pattern": "^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d(?:\\.\\d+)?)?(?:Z))$"
              },
              {
                "type": "null"
              }
            ],
            "description": "ISO 8601 timestamp recording when the client replied or responded"
          }
        },
        "required": [
          "proposal_id"
        ]
      },
      "annotations": {
        "title": "Update Proposal",
        "readOnlyHint": false,
        "destructiveHint": false,
        "idempotentHint": true,
        "openWorldHint": false
      }
    },
    {
      "name": "accept_proposal",
      "description": "Mark a proposal as accepted, record the response timestamp, and automatically seed the linked project's scope_definitions from the proposal deliverables in a single atomic operation. Use when the freelancer confirms that a client has accepted the proposal and work is ready to begin.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "proposal_id": {
            "type": "string",
            "format": "uuid",
            "pattern": "^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$",
            "description": "UUID of the proposal that the client has agreed to accept"
          }
        },
        "required": [
          "proposal_id"
        ]
      },
      "annotations": {
        "title": "Accept Proposal",
        "readOnlyHint": false,
        "destructiveHint": false,
        "idempotentHint": true,
        "openWorldHint": false
      }
    },
    {
      "name": "create_invoice",
      "description": "Create and persist a new invoice with line items, tax, and totals in the FreelanceOS database. Use when the freelancer wants to generate and save a billable invoice for a completed or ongoing project.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "client_id": {
            "type": "string",
            "format": "uuid",
            "pattern": "^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$",
            "description": "UUID of the client being billed; must match an existing client record"
          },
          "project_id": {
            "type": "string",
            "format": "uuid",
            "pattern": "^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$",
            "description": "UUID of the project this invoice covers; used to group invoices by engagement"
          },
          "invoice_number": {
            "type": "string",
            "minLength": 1,
            "description": "Unique human-readable invoice identifier shown on the document, e.g. INV-001"
          },
          "proposal_id": {
            "anyOf": [
              {
                "type": "string",
                "format": "uuid",
                "pattern": "^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$"
              },
              {
                "type": "null"
              }
            ],
            "description": "UUID of the originating proposal if this invoice was generated from an approved proposal"
          },
          "line_items": {
            "default": [],
            "description": "Ordered list of billable line items that make up the body of the invoice",
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "description": {
                  "type": "string",
                  "description": "Human-readable label for this billable line item, e.g. \"Website design \u00e2\u20ac\u201c homepage\""
                },
                "quantity": {
                  "type": "number",
                  "description": "Number of units delivered for this line item, e.g. 8 for 8 hours"
                },
                "unit": {
                  "type": "string",
                  "description": "Unit of measure for the quantity field, e.g. \"hours\", \"days\", or \"project\""
                },
                "rate": {
                  "type": "number",
                  "description": "Price charged per single unit in the invoice currency, e.g. 150.00 for $150/hr"
                },
                "amount": {
                  "type": "number",
                  "description": "Pre-calculated total for this line item (quantity \u00c3\u2014 rate), used for display and subtotal roll-up"
                }
              },
              "required": [
                "description",
                "quantity",
                "unit",
                "rate",
                "amount"
              ]
            }
          },
          "subtotal": {
            "default": 0,
            "description": "Sum of all line item amounts before tax is applied, in the invoice currency",
            "type": "number"
          },
          "tax_rate": {
            "anyOf": [
              {
                "type": "number"
              },
              {
                "type": "null"
              }
            ],
            "description": "Applicable tax rate expressed as a decimal fraction, e.g. 0.1 for 10% GST or sales tax"
          },
          "tax_amount": {
            "default": 0,
            "description": "Calculated tax value derived from subtotal \u00c3\u2014 tax_rate, in the invoice currency",
            "type": "number"
          },
          "total": {
            "default": 0,
            "description": "Final amount due including subtotal and tax, in the invoice currency",
            "type": "number"
          },
          "currency": {
            "default": "USD",
            "description": "Three-letter ISO 4217 currency code for all monetary values on this invoice, e.g. USD, EUR, GBP",
            "type": "string",
            "minLength": 3,
            "maxLength": 3
          },
          "due_date": {
            "anyOf": [
              {
                "type": "string"
              },
              {
                "type": "null"
              }
            ],
            "description": "Payment deadline for the invoice formatted as YYYY-MM-DD, e.g. 2026-04-30"
          },
          "issued_at": {
            "anyOf": [
              {
                "type": "string"
              },
              {
                "type": "null"
              }
            ],
            "description": "ISO 8601 datetime when the invoice was formally issued to the client, defaults to now if omitted"
          },
          "notes": {
            "anyOf": [
              {
                "type": "string"
              },
              {
                "type": "null"
              }
            ],
            "description": "Optional freeform notes or payment instructions to include on the invoice"
          }
        },
        "required": [
          "client_id",
          "project_id",
          "invoice_number"
        ]
      },
      "annotations": {
        "title": "Create Invoice",
        "readOnlyHint": false,
        "destructiveHint": false,
        "idempotentHint": false,
        "openWorldHint": false
      }
    },
    {
      "name": "get_invoice",
      "description": "Retrieve the full details of a single invoice by its UUID. Use when the freelancer asks to view, review, or share the details of a specific invoice.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "invoice_id": {
            "type": "string",
            "format": "uuid",
            "pattern": "^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$",
            "description": "UUID of the invoice to retrieve; must reference a non-archived invoice owned by this user"
          }
        },
        "required": [
          "invoice_id"
        ]
      },
      "annotations": {
        "title": "Get Invoice",
        "readOnlyHint": true,
        "destructiveHint": false,
        "idempotentHint": true,
        "openWorldHint": false
      }
    },
    {
      "name": "list_invoices",
      "description": "Return a paginated, filtered list of invoices for the authenticated freelancer. Use when the freelancer asks about outstanding, paid, overdue, or draft invoices, or wants a revenue summary for a date range.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "status": {
            "description": "Restrict results to invoices with this specific lifecycle status, e.g. \"overdue\" to surface unpaid past-due invoices",
            "type": "string",
            "enum": [
              "draft",
              "sent",
              "paid",
              "overdue",
              "void"
            ]
          },
          "client_id": {
            "description": "Restrict results to invoices belonging to this specific client UUID",
            "type": "string",
            "format": "uuid",
            "pattern": "^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$"
          },
          "project_id": {
            "description": "Restrict results to invoices associated with this specific project UUID",
            "type": "string",
            "format": "uuid",
            "pattern": "^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$"
          },
          "date_from": {
            "description": "Return only invoices issued on or after this date, formatted as YYYY-MM-DD",
            "type": "string"
          },
          "date_to": {
            "description": "Return only invoices issued on or before this date, formatted as YYYY-MM-DD",
            "type": "string"
          },
          "sort_by": {
            "default": "created_at",
            "description": "Database column used to order the result set before pagination is applied",
            "type": "string",
            "enum": [
              "created_at",
              "due_date",
              "total",
              "invoice_number"
            ]
          },
          "sort_dir": {
            "default": "desc",
            "description": "Direction of the sort: \"asc\" for oldest/lowest first, \"desc\" for newest/highest first",
            "type": "string",
            "enum": [
              "asc",
              "desc"
            ]
          },
          "limit": {
            "default": 20,
            "description": "Maximum number of invoice records to return in a single page, between 1 and 100",
            "type": "integer",
            "minimum": 1,
            "maximum": 100
          },
          "offset": {
            "default": 0,
            "description": "Zero-based index of the first record to return, used for paginating through large result sets",
            "type": "integer",
            "minimum": 0,
            "maximum": 9007199254740991
          }
        }
      },
      "annotations": {
        "title": "List Invoices",
        "readOnlyHint": true,
        "destructiveHint": false,
        "idempotentHint": true,
        "openWorldHint": false
      }
    },
    {
      "name": "update_invoice",
      "description": "Update one or more fields on an existing invoice, including its status or financial totals. Use when the freelancer marks an invoice as sent, records a payment, corrects line items, or changes the due date.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "invoice_id": {
            "type": "string",
            "format": "uuid",
            "pattern": "^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$",
            "description": "UUID of the invoice to update; must reference an existing invoice owned by this user"
          },
          "status": {
            "description": "New lifecycle status for the invoice, e.g. \"paid\" when the client has settled the balance",
            "type": "string",
            "enum": [
              "draft",
              "sent",
              "paid",
              "overdue",
              "void"
            ]
          },
          "line_items": {
            "description": "Replacement array of billable line items that fully overwrites the existing line items on the invoice",
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "description": {
                  "type": "string",
                  "description": "Human-readable label for this billable line item, e.g. \"Website design \u00e2\u20ac\u201c homepage\""
                },
                "quantity": {
                  "type": "number",
                  "description": "Number of units delivered for this line item, e.g. 8 for 8 hours"
                },
                "unit": {
                  "type": "string",
                  "description": "Unit of measure for the quantity field, e.g. \"hours\", \"days\", or \"project\""
                },
                "rate": {
                  "type": "number",
                  "description": "Price charged per single unit in the invoice currency, e.g. 150.00 for $150/hr"
                },
                "amount": {
                  "type": "number",
                  "description": "Pre-calculated total for this line item (quantity \u00c3\u2014 rate), used for display and subtotal roll-up"
                }
              },
              "required": [
                "description",
                "quantity",
                "unit",
                "rate",
                "amount"
              ]
            }
          },
          "subtotal": {
            "description": "Revised sum of all line item amounts before tax, in the invoice currency",
            "type": "number"
          },
          "tax_rate": {
            "anyOf": [
              {
                "type": "number"
              },
              {
                "type": "null"
              }
            ],
            "description": "Revised tax rate as a decimal fraction, e.g. 0.15 for 15%; set to null to remove tax"
          },
          "tax_amount": {
            "description": "Revised calculated tax value derived from the updated subtotal and tax rate",
            "type": "number"
          },
          "total": {
            "description": "Revised final amount due including subtotal and tax, in the invoice currency",
            "type": "number"
          },
          "due_date": {
            "anyOf": [
              {
                "type": "string"
              },
              {
                "type": "null"
              }
            ],
            "description": "Revised payment deadline formatted as YYYY-MM-DD; set to null to remove the due date"
          },
          "issued_at": {
            "anyOf": [
              {
                "type": "string"
              },
              {
                "type": "null"
              }
            ],
            "description": "Revised ISO 8601 datetime when the invoice was formally issued to the client"
          },
          "paid_at": {
            "anyOf": [
              {
                "type": "string"
              },
              {
                "type": "null"
              }
            ],
            "description": "ISO 8601 datetime when payment was received; set when marking an invoice as paid"
          },
          "notes": {
            "anyOf": [
              {
                "type": "string"
              },
              {
                "type": "null"
              }
            ],
            "description": "Revised freeform notes or payment instructions to display on the invoice; set to null to clear"
          }
        },
        "required": [
          "invoice_id"
        ]
      },
      "annotations": {
        "title": "Update Invoice",
        "readOnlyHint": false,
        "destructiveHint": false,
        "idempotentHint": true,
        "openWorldHint": false
      }
    },
    {
      "name": "create_time_entry",
      "description": "Log a time entry against a project to record hours worked. Use when the freelancer reports time spent on a task, meeting, or deliverable so it can be tracked and later billed to the client.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "project_id": {
            "type": "string",
            "format": "uuid",
            "pattern": "^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$",
            "description": "UUID of the project to log this time entry against"
          },
          "description": {
            "type": "string",
            "minLength": 1,
            "description": "Brief description of the work performed during this time block"
          },
          "duration_minutes": {
            "type": "integer",
            "exclusiveMinimum": 0,
            "maximum": 9007199254740991,
            "description": "Total duration of the work session expressed in whole minutes"
          },
          "entry_date": {
            "description": "Calendar date when the work was performed in YYYY-MM-DD format, defaults to today",
            "type": "string"
          },
          "billable": {
            "default": true,
            "description": "Whether this time entry should be billed to the client on the next invoice",
            "type": "boolean"
          }
        },
        "required": [
          "project_id",
          "description",
          "duration_minutes"
        ]
      },
      "annotations": {
        "title": "Create Time Entry",
        "readOnlyHint": false,
        "destructiveHint": false,
        "idempotentHint": false,
        "openWorldHint": false
      }
    },
    {
      "name": "get_time_entry",
      "description": "Retrieve a single time entry record by its unique identifier. Use when the freelancer asks to view the details of a specific logged time entry, such as its description, duration, or billable status.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "time_entry_id": {
            "type": "string",
            "format": "uuid",
            "pattern": "^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$",
            "description": "Unique UUID identifier of the time entry record to retrieve"
          }
        },
        "required": [
          "time_entry_id"
        ]
      },
      "annotations": {
        "title": "Get Time Entry",
        "readOnlyHint": true,
        "destructiveHint": false,
        "idempotentHint": true,
        "openWorldHint": false
      }
    },
    {
      "name": "list_time_entries",
      "description": "List time entries with optional filtering by project, date range, and billable status. Use when reviewing logged hours for a project, preparing a timesheet, or checking what work has been recorded before generating an invoice.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "project_id": {
            "description": "UUID of the project to filter time entries by, omit to list across all projects",
            "type": "string",
            "format": "uuid",
            "pattern": "^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$"
          },
          "start_date": {
            "description": "Include only entries on or after this date in YYYY-MM-DD format",
            "type": "string"
          },
          "end_date": {
            "description": "Include only entries on or before this date in YYYY-MM-DD format",
            "type": "string"
          },
          "billable": {
            "description": "Filter results to only billable or only non-billable time entries",
            "type": "boolean"
          },
          "sort_by": {
            "default": "entry_date",
            "description": "Database column to use when ordering the returned time entries",
            "type": "string",
            "enum": [
              "entry_date",
              "created_at",
              "duration_minutes"
            ]
          },
          "sort_dir": {
            "default": "desc",
            "description": "Direction to sort results \u00e2\u20ac\u201d asc for oldest first, desc for newest first",
            "type": "string",
            "enum": [
              "asc",
              "desc"
            ]
          },
          "limit": {
            "default": 20,
            "description": "Maximum number of time entry records to return in a single page",
            "type": "integer",
            "minimum": 1,
            "maximum": 100
          },
          "offset": {
            "default": 0,
            "description": "Number of records to skip for cursor-based pagination through large result sets",
            "type": "integer",
            "minimum": 0,
            "maximum": 9007199254740991
          }
        }
      },
      "annotations": {
        "title": "List Time Entries",
        "readOnlyHint": true,
        "destructiveHint": false,
        "idempotentHint": true,
        "openWorldHint": false
      }
    },
    {
      "name": "update_time_entry",
      "description": "Update one or more fields on an existing time entry record. Use when the freelancer needs to correct a logged entry's duration, description, date, or billable flag after it was originally saved.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "time_entry_id": {
            "type": "string",
            "format": "uuid",
            "pattern": "^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$",
            "description": "Unique UUID identifier of the time entry record to update"
          },
          "description": {
            "description": "Revised description of the work performed during this time block",
            "type": "string",
            "minLength": 1
          },
          "duration_minutes": {
            "description": "Corrected duration of the work session expressed in whole minutes",
            "type": "integer",
            "exclusiveMinimum": 0,
            "maximum": 9007199254740991
          },
          "entry_date": {
            "description": "Corrected date when the work was performed in YYYY-MM-DD format",
            "type": "string"
          },
          "billable": {
            "description": "Updated flag indicating whether this time entry should be billed to the client",
            "type": "boolean"
          }
        },
        "required": [
          "time_entry_id"
        ]
      },
      "annotations": {
        "title": "Update Time Entry",
        "readOnlyHint": false,
        "destructiveHint": false,
        "idempotentHint": true,
        "openWorldHint": false
      }
    },
    {
      "name": "archive_time_entry",
      "description": "Soft-delete a time entry by setting its archived_at timestamp, hiding it from all queries. Use when the freelancer wants to permanently remove an incorrectly logged or duplicate time entry from their records without destroying the underlying data.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "time_entry_id": {
            "type": "string",
            "format": "uuid",
            "pattern": "^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$",
            "description": "Unique UUID identifier of the time entry record to soft-delete by archiving"
          }
        },
        "required": [
          "time_entry_id"
        ]
      },
      "annotations": {
        "title": "Archive Time Entry",
        "readOnlyHint": false,
        "destructiveHint": true,
        "idempotentHint": true,
        "openWorldHint": false
      }
    },
    {
      "name": "aggregate_time",
      "description": "Calculate the total minutes and hours logged against a project over an optional date range. Use when preparing an invoice, verifying billable hours before sending to a client, or generating a summary timesheet report.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "project_id": {
            "type": "string",
            "format": "uuid",
            "pattern": "^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$",
            "description": "UUID of the project whose time entries should be summed and aggregated"
          },
          "start_date": {
            "description": "Beginning of the aggregation window in YYYY-MM-DD format, inclusive",
            "type": "string"
          },
          "end_date": {
            "description": "End of the aggregation window in YYYY-MM-DD format, inclusive",
            "type": "string"
          },
          "billable_only": {
            "default": true,
            "description": "When true, only sum time entries that are marked as billable to the client",
            "type": "boolean"
          }
        },
        "required": [
          "project_id"
        ]
      },
      "annotations": {
        "title": "Aggregate Time",
        "readOnlyHint": true,
        "destructiveHint": false,
        "idempotentHint": true,
        "openWorldHint": false
      }
    },
    {
      "name": "create_scope",
      "description": "Define and persist the agreed project scope with deliverables, boundaries, and exclusions. Use this tool when starting a new project or immediately after a proposal is accepted by the client to establish a clear, shared understanding of what will be built.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "project_id": {
            "type": "string",
            "format": "uuid",
            "pattern": "^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$",
            "description": "UUID of the project this scope definition belongs to"
          },
          "deliverables": {
            "type": "string",
            "minLength": 1,
            "description": "Detailed free-form description of all outputs and artifacts that will be delivered to the client"
          },
          "boundaries": {
            "description": "Explicit statement of what work is inside and outside the agreed scope for this project",
            "type": "string"
          },
          "assumptions": {
            "description": "Assumptions made by the freelancer when defining this scope that the client should be aware of",
            "type": "string"
          },
          "exclusions": {
            "description": "Specific work items or deliverables that are explicitly excluded from this project scope",
            "type": "string"
          }
        },
        "required": [
          "project_id",
          "deliverables"
        ]
      },
      "annotations": {
        "title": "Create Project Scope",
        "readOnlyHint": false,
        "destructiveHint": false,
        "idempotentHint": false,
        "openWorldHint": false
      }
    },
    {
      "name": "get_scope",
      "description": "Retrieve the current active scope definition for a project, including deliverables, boundaries, assumptions, and exclusions. Use when the freelancer wants to review exactly what was agreed with the client before starting work or answering a scope question.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "project_id": {
            "type": "string",
            "format": "uuid",
            "pattern": "^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$",
            "description": "UUID of the project whose scope definition should be retrieved"
          }
        },
        "required": [
          "project_id"
        ]
      },
      "annotations": {
        "title": "Get Project Scope",
        "readOnlyHint": true,
        "destructiveHint": false,
        "idempotentHint": true,
        "openWorldHint": false
      }
    },
    {
      "name": "update_scope",
      "description": "Update one or more fields of the active scope definition for a project. Use when the client and freelancer have mutually agreed to change the scope and the persisted record needs to reflect the new agreement.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "project_id": {
            "type": "string",
            "format": "uuid",
            "pattern": "^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$",
            "description": "UUID of the project whose scope definition should be updated"
          },
          "deliverables": {
            "description": "Revised description of all outputs and artifacts that will be delivered under the updated scope",
            "type": "string",
            "minLength": 1
          },
          "boundaries": {
            "anyOf": [
              {
                "type": "string"
              },
              {
                "type": "null"
              }
            ],
            "description": "Revised statement of what work is inside and outside the agreed scope after the change"
          },
          "assumptions": {
            "anyOf": [
              {
                "type": "string"
              },
              {
                "type": "null"
              }
            ],
            "description": "Revised assumptions that underpin the updated scope agreement with the client"
          },
          "exclusions": {
            "anyOf": [
              {
                "type": "string"
              },
              {
                "type": "null"
              }
            ],
            "description": "Revised list of work items or deliverables that are explicitly excluded from the updated scope"
          }
        },
        "required": [
          "project_id"
        ]
      },
      "annotations": {
        "title": "Update Project Scope",
        "readOnlyHint": false,
        "destructiveHint": false,
        "idempotentHint": true,
        "openWorldHint": false
      }
    },
    {
      "name": "log_scope_change",
      "description": "Record a client scope change request with classification and impact notes to maintain an auditable history of scope creep. Use this tool ONLY after the freelancer confirms they want to log the change \u00e2\u20ac\u201d never log speculatively without explicit instruction.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "project_id": {
            "type": "string",
            "format": "uuid",
            "pattern": "^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$",
            "description": "UUID of the project this scope change request is associated with"
          },
          "description": {
            "type": "string",
            "minLength": 1,
            "description": "Clear description of the change the client is requesting beyond the original agreed scope"
          },
          "classification": {
            "type": "string",
            "enum": [
              "in_scope",
              "out_of_scope",
              "needs_review"
            ],
            "description": "Classification of the change: in_scope (covered by existing agreement), out_of_scope (additional billable work), needs_review (ambiguous \u00e2\u20ac\u201d requires discussion with client)"
          },
          "impact": {
            "description": "Estimated impact of the change in terms of additional time, cost, or effort required",
            "type": "string"
          },
          "requested_at": {
            "description": "ISO 8601 datetime when the client requested this change \u00e2\u20ac\u201d defaults to current timestamp if omitted",
            "type": "string"
          },
          "resolved_at": {
            "description": "ISO 8601 datetime when this scope change request was resolved or formally accepted",
            "type": "string"
          }
        },
        "required": [
          "project_id",
          "description",
          "classification"
        ]
      },
      "annotations": {
        "title": "Log Scope Change",
        "readOnlyHint": false,
        "destructiveHint": false,
        "idempotentHint": false,
        "openWorldHint": false
      }
    },
    {
      "name": "list_scope_changes",
      "description": "List all scope change requests logged against a project, with optional filtering by classification and configurable sort order. Use when reviewing scope creep history, preparing a change-order summary, or auditing out-of-scope requests for billing.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "project_id": {
            "type": "string",
            "format": "uuid",
            "pattern": "^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$",
            "description": "UUID of the project whose scope change history should be listed"
          },
          "classification": {
            "description": "Optional filter to return only changes of a specific classification type",
            "type": "string",
            "enum": [
              "in_scope",
              "out_of_scope",
              "needs_review"
            ]
          },
          "sort_by": {
            "default": "requested_at",
            "description": "Database field used to order the returned scope change records",
            "type": "string",
            "enum": [
              "requested_at",
              "created_at"
            ]
          },
          "sort_dir": {
            "default": "desc",
            "description": "Sort direction \u00e2\u20ac\u201d desc returns the most recent changes first",
            "type": "string",
            "enum": [
              "asc",
              "desc"
            ]
          },
          "limit": {
            "default": 20,
            "description": "Maximum number of scope change records to return in a single page",
            "type": "integer",
            "minimum": 1,
            "maximum": 100
          },
          "offset": {
            "default": 0,
            "description": "Number of records to skip for pagination \u00e2\u20ac\u201d use with limit to page through results",
            "type": "integer",
            "minimum": 0,
            "maximum": 9007199254740991
          }
        },
        "required": [
          "project_id"
        ]
      },
      "annotations": {
        "title": "List Scope Changes",
        "readOnlyHint": true,
        "destructiveHint": false,
        "idempotentHint": true,
        "openWorldHint": false
      }
    },
    {
      "name": "check_scope",
      "description": "Retrieve the agreed scope definition and full change history for a project so Claude can assess whether a new client request falls within the original agreement. Use this tool when a client asks for something new and the freelancer wants an informed opinion on whether it is in scope before responding.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "project_id": {
            "type": "string",
            "format": "uuid",
            "pattern": "^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$",
            "description": "UUID of the project against whose scope the new request should be assessed"
          },
          "request_description": {
            "type": "string",
            "minLength": 1,
            "description": "Detailed description of the new client request to be evaluated against the agreed project scope"
          }
        },
        "required": [
          "project_id",
          "request_description"
        ]
      },
      "annotations": {
        "title": "Check Request Against Scope",
        "readOnlyHint": true,
        "destructiveHint": false,
        "idempotentHint": true,
        "openWorldHint": false
      }
    },
    {
      "name": "create_followup",
      "description": "Store a drafted follow-up message in the FreelanceOS database. Use when the freelancer has composed a follow-up and wants to save it for tracking purposes before or after sending it to the client.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "client_id": {
            "type": "string",
            "format": "uuid",
            "pattern": "^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$",
            "description": "UUID of the client this follow-up message is addressed to"
          },
          "project_id": {
            "description": "UUID of the specific project this follow-up is related to, if applicable",
            "type": "string",
            "format": "uuid",
            "pattern": "^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$"
          },
          "type": {
            "default": "check_in",
            "description": "Category of follow-up: proposal_follow_up, invoice_overdue, check_in, awaiting_response, or other",
            "type": "string",
            "enum": [
              "proposal_follow_up",
              "invoice_overdue",
              "check_in",
              "awaiting_response",
              "other"
            ]
          },
          "subject": {
            "type": "string",
            "minLength": 1,
            "description": "Subject line or brief title summarizing the purpose of this follow-up message"
          },
          "content": {
            "type": "string",
            "minLength": 1,
            "description": "Full body text of the follow-up message to be saved and potentially sent"
          }
        },
        "required": [
          "client_id",
          "subject",
          "content"
        ]
      },
      "annotations": {
        "title": "Create Follow-Up",
        "readOnlyHint": false,
        "destructiveHint": false,
        "idempotentHint": false,
        "openWorldHint": false
      }
    },
    {
      "name": "get_followup",
      "description": "Retrieve a single follow-up record by its unique ID. Use when the freelancer asks to view the full details of a specific saved follow-up, including its content, type, and sent status.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "followup_id": {
            "type": "string",
            "format": "uuid",
            "pattern": "^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$",
            "description": "Unique UUID identifier of the follow-up record to retrieve"
          }
        },
        "required": [
          "followup_id"
        ]
      },
      "annotations": {
        "title": "Get Follow-Up",
        "readOnlyHint": true,
        "destructiveHint": false,
        "idempotentHint": true,
        "openWorldHint": false
      }
    },
    {
      "name": "list_followups",
      "description": "List and filter follow-up records for a client or project with pagination support. Use when the freelancer asks to review follow-up history, check outstanding drafts, or audit all sent communications for a given client.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "client_id": {
            "description": "UUID of the client whose follow-ups should be returned",
            "type": "string",
            "format": "uuid",
            "pattern": "^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$"
          },
          "project_id": {
            "description": "UUID of the project to narrow results to follow-ups for that project",
            "type": "string",
            "format": "uuid",
            "pattern": "^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$"
          },
          "type": {
            "description": "Filter results to a specific follow-up category such as invoice_overdue or check_in",
            "type": "string",
            "enum": [
              "proposal_follow_up",
              "invoice_overdue",
              "check_in",
              "awaiting_response",
              "other"
            ]
          },
          "sent": {
            "description": "Pass true to return only sent follow-ups, false to return only unsent drafts",
            "type": "boolean"
          },
          "sort_by": {
            "default": "created_at",
            "description": "Database column to use when ordering the returned follow-up records",
            "type": "string",
            "enum": [
              "created_at",
              "sent_at"
            ]
          },
          "sort_dir": {
            "default": "desc",
            "description": "Direction to sort results \u00e2\u20ac\u201d asc for oldest first, desc for newest first",
            "type": "string",
            "enum": [
              "asc",
              "desc"
            ]
          },
          "limit": {
            "default": 20,
            "description": "Maximum number of follow-up records to return in a single response",
            "type": "integer",
            "minimum": 1,
            "maximum": 100
          },
          "offset": {
            "default": 0,
            "description": "Number of records to skip for cursor-based pagination through large result sets",
            "type": "integer",
            "minimum": 0,
            "maximum": 9007199254740991
          }
        }
      },
      "annotations": {
        "title": "List Follow-Ups",
        "readOnlyHint": true,
        "destructiveHint": false,
        "idempotentHint": true,
        "openWorldHint": false
      }
    },
    {
      "name": "update_followup",
      "description": "Update the content or metadata of an existing follow-up record. Use when the freelancer wants to revise a drafted follow-up's subject, body, type, or project association before sending it to the client.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "followup_id": {
            "type": "string",
            "format": "uuid",
            "pattern": "^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$",
            "description": "Unique UUID of the follow-up record that should be updated"
          },
          "subject": {
            "description": "Replacement subject line to overwrite the existing follow-up subject",
            "type": "string",
            "minLength": 1
          },
          "content": {
            "description": "Replacement message body text to overwrite the existing follow-up content",
            "type": "string",
            "minLength": 1
          },
          "type": {
            "description": "New category to assign this follow-up, such as changing check_in to invoice_overdue",
            "type": "string",
            "enum": [
              "proposal_follow_up",
              "invoice_overdue",
              "check_in",
              "awaiting_response",
              "other"
            ]
          },
          "project_id": {
            "anyOf": [
              {
                "type": "string",
                "format": "uuid",
                "pattern": "^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$"
              },
              {
                "type": "null"
              }
            ],
            "description": "UUID of a project to associate with this follow-up, or null to remove the project link"
          }
        },
        "required": [
          "followup_id"
        ]
      },
      "annotations": {
        "title": "Update Follow-Up",
        "readOnlyHint": false,
        "destructiveHint": false,
        "idempotentHint": true,
        "openWorldHint": false
      }
    },
    {
      "name": "mark_followup_sent",
      "description": "Record the current timestamp as the sent date on a follow-up, transitioning it from draft to sent status. Use when the freelancer confirms they have actually sent the follow-up message to the client outside of FreelanceOS.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "followup_id": {
            "type": "string",
            "format": "uuid",
            "pattern": "^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$",
            "description": "Unique UUID of the follow-up record that the freelancer has just sent to the client"
          }
        },
        "required": [
          "followup_id"
        ]
      },
      "annotations": {
        "title": "Mark Follow-Up Sent",
        "readOnlyHint": false,
        "destructiveHint": false,
        "idempotentHint": true,
        "openWorldHint": false
      }
    },
    {
      "name": "get_followup_context",
      "description": "Fetch all relevant context needed to draft an effective follow-up for a client, including outstanding invoices, recent follow-up history, and client contact details. Always call this tool before create_followup so the drafted message is informed by the client's current account status.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "client_id": {
            "type": "string",
            "format": "uuid",
            "pattern": "^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$",
            "description": "UUID of the client for whom follow-up context \u00e2\u20ac\u201d invoices, prior messages, contact info \u00e2\u20ac\u201d should be assembled"
          },
          "project_id": {
            "description": "UUID of a specific project to restrict invoice context to that project only, rather than all client invoices",
            "type": "string",
            "format": "uuid",
            "pattern": "^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$"
          }
        },
        "required": [
          "client_id"
        ]
      },
      "annotations": {
        "title": "Get Follow-Up Context",
        "readOnlyHint": true,
        "destructiveHint": false,
        "idempotentHint": true,
        "openWorldHint": false
      }
    }
  ],
  "resources": [
    {
      "uri": "freelance://summary",
      "name": "business-summary",
      "description": "High-level overview of your freelance business: total clients, active projects, pending invoices, and recent activity.",
      "mimeType": "text/plain"
    }
  ],
  "prompts": [
    {
      "name": "freelance-onboarding",
      "description": "Step-by-step guide to set up your freelance business in FreelanceOS. Walks through creating your first client, project, proposal, and invoice."
    },
    {
      "name": "weekly-review",
      "description": "Generate a weekly summary of time logged, invoices due, and follow-ups needed across all active projects."
    }
  ]
};
