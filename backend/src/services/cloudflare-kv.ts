/**
 * Cloudflare KV Storage Interface
 * Note: Since you didn't provide CF credentials, this acts as a mock/local 
 * fallback that simulates the Cloudflare REST API KV behavior using an in-memory Map,
 * allowing you to easily swap in the real credentials later.
 */

const kvStore = new Map<string, string>();

export async function putTestCase(assignmentId: string, testCaseId: string, data: { input: string, expectedOut: string }) {
    const key = `testcase:${assignmentId}:${testCaseId}`;
    
    // MOCK CLOUDFLARE KV REST API (Simulating the PUT request)
    // const url = \`https://api.cloudflare.com/client/v4/accounts/\${process.env.CF_ACCOUNT_ID}/storage/kv/namespaces/\${process.env.CF_KV_NAMESPACE}/values/\${key}\`;
    // await fetch(url, { method: "PUT", headers: { Authorization: \`Bearer \${process.env.CF_API_TOKEN}\` }, body: JSON.stringify(data) });
    
    console.log(`[Cloudflare KV] PUT ${key}`);
    kvStore.set(key, JSON.stringify(data));
}

export async function getTestCase(assignmentId: string, testCaseId: string): Promise<{ input: string, expectedOut: string } | null> {
    const key = `testcase:${assignmentId}:${testCaseId}`;
    
    // MOCK CLOUDFLARE KV REST API (Simulating the GET request)
    // const url = \`https://api.cloudflare.com/client/v4/accounts/\${process.env.CF_ACCOUNT_ID}/storage/kv/namespaces/\${process.env.CF_KV_NAMESPACE}/values/\${key}\`;
    // const res = await fetch(url, { headers: { Authorization: \`Bearer \${process.env.CF_API_TOKEN}\` }});
    // return await res.json();
    
    console.log(`[Cloudflare KV] GET ${key}`);
    const val = kvStore.get(key);
    if (!val) return null;
    return JSON.parse(val);
}
