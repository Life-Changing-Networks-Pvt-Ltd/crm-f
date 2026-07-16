import fs from 'fs';
import path from 'path';

const basePath = 'c:/crm/crm-client/src/pages';

const processFile = (srcFile, destFile) => {
  let content = fs.readFileSync(path.join(basePath, srcFile), 'utf-8');
  
  // Replace references
  content = content.replace(/Customers/g, 'Contacts');
  content = content.replace(/Customer/g, 'Contact');
  content = content.replace(/customers/g, 'contacts');
  content = content.replace(/customer/g, 'contact');
  
  // Contacts don't have totalSpend. We can just remove totalSpend blocks.
  // In Create/Edit forms:
  content = content.replace(/totalSpend: 0/g, ''); // removes totalSpend from initial state
  content = content.replace(/totalSpend: contact\.totalSpend \|\| 0,/g, '');
  content = content.replace(/contact\.totalSpend > 0 && \(/g, 'false && ('); // disable the spend display
  
  // Fix excel headers
  content = content.replace(/templateHeaders=\{\["Name", "Email", "Phone", "Company", "Address", "Status", "TotalSpend"\]\}/g, 
    'templateHeaders={["Name", "Email", "Phone", "Company", "Designation", "Status"]}');
    
  // Rename address to designation
  content = content.replace(/address: ''/g, "designation: ''");
  content = content.replace(/address: contact\.address \|\| '',/g, "designation: contact.designation || '',");
  content = content.replace(/formData\.address/g, "formData.designation");
  content = content.replace(/contact\.address/g, "contact.designation");
  content = content.replace(/Label htmlFor="address">Address<\/Label>/g, 'Label htmlFor="designation">Designation</Label>');
  content = content.replace(/id="address" name="address"/g, 'id="designation" name="designation"');
  content = content.replace(/placeholder="Street address, City, Country"/g, 'placeholder="E.g., Software Engineer"');
  content = content.replace(/"No address provided"/g, '"No designation provided"');
  
  // Rename company to companyName
  content = content.replace(/company: ''/g, "companyName: ''");
  content = content.replace(/company: contact\.company \|\| '',/g, "companyName: contact.companyName || '',");
  content = content.replace(/formData\.company/g, "formData.companyName");
  content = content.replace(/contact\.company/g, "contact.companyName");
  content = content.replace(/Label htmlFor="company">Company/g, 'Label htmlFor="companyName">Company');
  content = content.replace(/id="company" name="company"/g, 'id="companyName" name="companyName"');
  
  // Delete financial info block entirely in Create/Edit
  content = content.replace(/\{\/\* Financial Info \*\/\}.*?<\/Card>/gs, '');

  fs.writeFileSync(path.join(basePath, destFile), content);
  console.log(`Generated ${destFile}`);
}

processFile('Customers.tsx', 'Contacts.tsx');
processFile('CreateCustomer.tsx', 'CreateContact.tsx');
processFile('EditCustomer.tsx', 'EditContact.tsx');
