/// <reference types="cypress" />
import pdf from 'pdf-parse';

Cypress.Commands.add('login', (username, password) => {
  cy.visit('/login');
  cy.get('input[name=email]').type(username);
  cy.get('input[name=password]').type(password);
  cy.get('button[type=submit]').click();
});

describe('PO Workflow E2E', () => {
  it('should create, approve, and verify PO data integrity including product link', () => {
    const testLink = 'https://example.com/product';

    // 1. Login
    cy.login('admin@yourdomain.com', 'yourpassword');

    // 2. Create PO
    cy.visit('/inventory/YourSite/orders');
    cy.contains('Create PO').click();

    // Fill out PO form (adjust selectors as needed)
    cy.get('input[name="productName"]').type('Test Product');
    cy.get('input[name="productLink"]').type(testLink);
    // ...fill other required fields...
    cy.contains('Add to Order').click();
    cy.contains('Send for Approval').click();

    // 3. Check PO in pending/draft tab
    cy.contains('Test Product').parents('tr').within(() => {
      cy.contains(testLink);
    });

    // 4. Approve PO (simulate as admin)
    cy.contains('Approve').click();

    // 5. Check PO in approved tab
    cy.contains('Approved').click();
    cy.contains('Test Product').parents('tr').within(() => {
      cy.contains(testLink);
    });

    // 6. Download PDF and check for link
    cy.contains('Test Product').parents('tr').within(() => {
      cy.contains('PDF').click();
    });

    // Wait for PDF download and parse it
    const downloadsFolder = Cypress.config('downloadsFolder');
    cy.readFile(`${downloadsFolder}/PO-*.pdf`, 'base64', { timeout: 15000 }).then((pdfBase64) => {
      return pdf(Buffer.from(pdfBase64, 'base64'));
    }).then((data) => {
      expect(data.text).to.include(testLink);
    });
  });
});