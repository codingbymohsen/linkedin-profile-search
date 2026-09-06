import { toList } from '../lib/format';

// Displays the public, recruitment-relevant summary of one profile.
export default function ProfileCard({ profile, onOpen }) {
	const skills = toList(profile.skills);
	return (
		<article className="card">
			<div className="avatar">
				{(profile.full_name || '?')[0].toUpperCase()}
			</div>
			<div className="cardbody">
				<div className="cardtitle">
					<div>
						<h2>{profile.full_name || 'Unnamed profile'}</h2>
						<p>
							{profile.job_title || 'Role unavailable'}{' '}
							<em>{toList(profile.job_title_levels)[0]}</em>
						</p>
					</div>
					<span className="bookmark">♡</span>
				</div>
				<div className="company">
					▣ {profile.job_company_name || '—'}　·　{profile.industry || '—'}　·　
					{profile.job_company_size || '—'} employees　·　Founded{' '}
					{profile.job_company_founded || '—'}
				</div>
				<div className="facts">
					<span>⌖ {profile.location_name || '—'}</span>
					<span>♧ {profile.linkedin_connections || 0} connections</span>
					<span>▣ {profile.inferred_years_experience || 0} yrs exp.</span>
					<span>◈ {profile.inferred_salary || '—'}</span>
				</div>
				<div className="tags">
					{skills.slice(0, 6).map((skill) => (
						<span key={skill}>{skill}</span>
					))}
				</div>
			</div>
			<button className="details" onClick={() => onOpen(profile)}>
				View details　⌄
			</button>
		</article>
	);
}
