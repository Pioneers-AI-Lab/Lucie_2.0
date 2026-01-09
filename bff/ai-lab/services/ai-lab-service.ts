import { aiLabModel } from "../models/ai-lab-model";

export const aiLabService =  {
	async getFields() {
		const fields = await aiLabModel.getFields();
		return fields;
	},
}
