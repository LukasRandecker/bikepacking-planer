const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

function swaggerDocs(app, port) {
  const options = {
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'Projekt Server',
        description: "Server für die Abschlussprojekte",
        contact: {
          name: "Manuel Fehrenbach",
          email: "manuel.fehrenbach@hfu.eu",
        },
        version: '1.0.0',
      },
      servers: [
        {
          url: `http://localhost:${port}/`,
          description: "Local Server"
        }
      ]
    },
    apis: ['./routes/bikepacking/*.js'],
  };

  const swaggerSpec = swaggerJsdoc(options);

  // Swagger UI
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  // JSON Dokumentation
  app.get('/docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  console.log(`Swagger docs available at http://localhost:${port}/docs`);
}

module.exports = swaggerDocs;
