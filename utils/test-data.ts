export type TestData = {
  company: {
    name: string;
    website: string;
    phone: string;
  };
  contact: {
    firstName: string;
    lastName: string;
    email: string;
  };
};

export function generateTestData(): TestData {
  const id = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;

  return {
    company: {
      name: `PW Automation Corp ${id}`,
      website: `https://automation-${id}.example.com`,
      phone: `+1555${String(Math.floor(1000000 + Math.random() * 8999999))}`
    },
    contact: {
      firstName: `Auto${id.replace(/[^0-9]/g, '')}`,
      lastName: 'Tester',
      email: `playwright.${id.replace(/[^0-9]/g, '')}@example.com`
    }
  };
}
