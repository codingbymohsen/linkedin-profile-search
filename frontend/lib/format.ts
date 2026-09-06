// Normalize serialized array fields from the imported LinkedIn export.
export function toList(value) {
	return String(value || '')
		.replace(/[\[\]'\"]/g, '')
		.split(',')
		.map((item) => item.trim())
		.filter(Boolean);
}
