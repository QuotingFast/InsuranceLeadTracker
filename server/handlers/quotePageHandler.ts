import { Request, Response } from "express";
import { storage } from "../storage";
import path from "path";
import fs from "fs";

// HTML template for the standalone quote page
const QUOTE_TEMPLATE_PATH = path.join(process.cwd(), 'server/templates/quote.html');

export async function serveQuotePage(req: Request, res: Response) {
  try {
    const quoteId = req.params.id || req.query.id;
    
    if (!quoteId || typeof quoteId !== 'string') {
      return res.redirect('/error.html');
    }

    // Fetch lead data by QF code
    const lead = await storage.getLeadByQfCode(quoteId);
    if (!lead) {
      return res.redirect('/expired.html');
    }

    // Get additional details
    const leadWithDetails = await storage.getLeadWithDetails(lead.id);
    if (!leadWithDetails) {
      return res.redirect('/error.html');
    }

    // Format data for the quote page
    const quoteData = {
      quote_id: lead.qfCode,
      first_name: lead.firstName,
      last_name: lead.lastName,
      city: lead.city,
      state: lead.state,
      zip: lead.zipCode,
      current_carrier: lead.currentPolicy || 'Not Specified',
      insurance_status: lead.currentPolicy ? 'yes' : 'no',
      dui_status: leadWithDetails.drivers.some(d => d.violations > 0) ? 'yes' : 'no',
      vehicles: leadWithDetails.vehicles.map(v => ({
        year: v.year,
        make: v.make,
        model: v.model,
        vin: v.vin || 'Unknown',
        usage: v.primaryUse || 'Personal'
      })),
      drivers: leadWithDetails.drivers.map(d => ({
        name: d.firstName + ' ' + d.lastName,
        type: d.relationship === 'primary' ? 'primary' : 'covered'
      }))
    };

    // Track quote view
    await storage.createQuoteView({
      leadId: lead.id,
      qfCode: lead.qfCode,
      userAgent: req.headers['user-agent'] || 'Unknown',
      ipAddress: req.ip || req.connection.remoteAddress || 'Unknown'
    });

    // Read the HTML template
    let htmlTemplate;
    try {
      htmlTemplate = fs.readFileSync(QUOTE_TEMPLATE_PATH, 'utf8');
    } catch (error) {
      console.error('Error reading quote template:', error);
      return res.status(500).send('Server error loading template');
    }

    // Insert the quote data into the HTML template
    const renderedHtml = htmlTemplate.replace(
      '<script id="quoteData" type="application/json"></script>',
      `<script id="quoteData" type="application/json">${JSON.stringify(quoteData)}</script>`
    );

    // Send the HTML response
    res.setHeader('Content-Type', 'text/html');
    res.send(renderedHtml);

  } catch (error) {
    console.error('Error serving quote page:', error);
    res.redirect('/error.html');
  }
}
