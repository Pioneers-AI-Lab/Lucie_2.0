import ky from "ky";

// ! NOTE: this was used for the Airtable API client, but we are now using airtable.js mcp client instead
export const apiClient = ky.create({
	prefixUrl: "https://api.airtable.com/v0/",
	headers: {
		"Authorization": `Bearer ${process.env.AIRTABLE_API_KEY}`,
	},
});
