// A reusable single-select filter control.
export default function Filter({ label, value, onChange, options = [] }) {
	const safeOptions = Array.isArray(options) ? options : [];
	return (
		<label className="filter">
			<span>{label}</span>
			<select
				value={value || ''}
				onChange={(event) => onChange(event.target.value)}
			>
				<option value="">All {label.toLowerCase()}</option>
				{safeOptions.map((option) => (
					<option key={option}>{option}</option>
				))}
			</select>
		</label>
	);
}
