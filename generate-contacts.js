import fs from 'fs';
import path from 'path';

const basePath = 'c:/crm/crm-client/src/pages';

const processFile = (srcFile, destFile) => {
  const content = fs.readFileSync(path.join(basePath, srcFile), 'utf-8');
  let newContent = content
    .replace(/Customers/g, 'Contacts')
    .replace(/Customer/g, 'Contact')
    .replace(/customers/g, 'contacts')
    .replace(/customer/g, 'contact')
    .replace(/address/g, 'designation') // Change address to designation since it fits Contact model
    .replace(/totalSpend/g, 'companyName') // totalSpend replaced by companyName just to reuse the field for display. But wait, I'll do manual edits via replace. 
    ; 
  fs.writeFileSync(path.join(basePath, destFile), newContent);
  console.log(`Generated ${destFile}`);
}

processFile('Customers.tsx', 'Contacts.tsx');
processFile('CreateCustomer.tsx', 'CreateContact.tsx');
processFile('EditCustomer.tsx', 'EditContact.tsx');
