import express from 'express';
import cors from 'cors';
import multer from 'multer';
import csvToJson from 'convert-csv-to-json';

const app = express();
const port = process.env.PORT || 3000;

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

let user_data = [];

app.use(cors({
	origin: 'http://localhost:4000',
}));

app.post('/api/files', upload.single('file'), async (req, res) => {
	const { file } = req;
	if (!file) {
		return res.status(500).json({ message: 'file is required' });
	}
	if (file.mimetype !== 'text/csv') {
		return res.status(500).json({ message: 'file must be a csv' });
	}

	let json = [];
	try {
		const csv = Buffer.from(file.buffer).toString('utf-8');
		console.log(csv);
		json = csvToJson.fieldDelimiter(",").csvStringToJson(csv);
		console.log(json);
	} catch (error) {
		return res.status(500).json({ message: 'Error parsing file: ' + error.message });
	}

	user_data = json;
	return res.status(200).json({ data: json, message: 'file was loaded' });
});

app.get('/api/users', async (req, res) => {
	const { q } = req.query;

	if (!q) {
		return res.status(500).json({ message: 'query param q is required' });
	}

	const search = q.toString().toLowerCase();
	
	const filtered_data = user_data.filter(row => Object
		.values(row)
		.some(value => value.toLowerCase().includes(search)));

	return res.status(200).json({ data: filtered_data });
});

app.listen(port, () => {
	console.log(`Server running at: http://localhost:${port}`)
});
