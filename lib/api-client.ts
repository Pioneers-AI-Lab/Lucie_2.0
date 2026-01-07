import ky from "ky";

export const apiClient = ky.create({
	prefixUrl: "https://api.airtable.com/v0/",
	headers: {
		"Authorization": `Bearer ${process.env.AIRTABLE_API_KEY}`,
	},
});
