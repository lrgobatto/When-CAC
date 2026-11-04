import type { NextApiRequest, NextApiResponse } from "next";
import { SeverityNumber } from "@opentelemetry/api-logs";
import { getGuessVideo, GuessVideo } from '../../../api/database';
import { APIError } from "./index";
import { flushPostHogLogs, getPostHogLogger } from "../../../../instrumentation";

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse<GuessVideo | APIError>,
) {
	if (req.method === 'OPTIONS') {
		res.status(200).end();
		return;
	}
	else if (req.method === 'GET') {
		// console.log(typeof (req.query?.round))
		if (typeof (req.query?.uuid) == 'string' && typeof (req.query?.round) == 'string') {
			const round = Number(req.query?.round);
			const guessVideo = await getGuessVideo(req.query.uuid, round);
			if (guessVideo) {
				getPostHogLogger()?.emit({
					severityNumber: SeverityNumber.INFO,
					body: "game round loaded",
					attributes: {
						event: "game_round_loaded",
						round_number: round,
						http_status_code: 200,
					},
				});
				await flushPostHogLogs();
				res.status(200).json(guessVideo);
			}
			else
				res.status(404).json({ message: "Not Found" });
		} else {
			res.status(400).json({ message: "Bad Request" });
		}
	} else {
		res.status(405).json({ message: "Method Not Allowed" });
	}
}
