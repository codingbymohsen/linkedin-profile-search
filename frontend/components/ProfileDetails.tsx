import { toList } from '../lib/format';
import { useState } from 'react';

function Info({ title, value }) {
	return (
		<div className="info">
			<b>{title}</b>
			<p>{value || '—'}</p>
		</div>
	);
}

// Side panel for the complete set of non-sensitive profile fields.
export default function ProfileDetails({ profile, onClose }) {
	if (!profile) return null;
	const [activeTab, setActiveTab] = useState('Profile');
	return (
		<aside className="details-panel">
			<div className="paneltop">
				<button onClick={onClose}>←</button>
				<button onClick={onClose}>×</button>
			</div>
			<div className="person">
				<div className="bigavatar">
					{(profile.full_name || '?')[0].toUpperCase()}
				</div>
				<div>
					<h2>{profile.full_name}</h2>
					<p>
						{profile.job_title} <em>{toList(profile.job_title_levels)[0]}</em>
					</p>
					<small>
						▣ {profile.job_company_name || '—'} · {profile.industry || '—'}
						<br />⌖ {profile.location_name || '—'}
					</small>
				</div>
			</div>
			<div className="detailfacts">
				<span>▣ {profile.inferred_years_experience || 0}+ yrs exp.</span>
				<span>♧ {profile.linkedin_connections || 0} connections</span>
				<span>◈ {profile.inferred_salary || '—'}</span>
			</div>
			<nav className="tabs">
				{['Profile', 'Experience', 'Skills', 'Education', 'More'].map((tab) => <button className={activeTab === tab ? 'active' : ''} key={tab} onClick={() => setActiveTab(tab)}>{tab}</button>)}
			</nav>
			<div className="panelcontent">
				<h3>Summary</h3>
				<p>{profile.summary || 'No summary available.'}</p>
				<div className="infogrid">
					<Info title="Current role" value={profile.job_title} />
					<Info
						title="Company"
						value={`${profile.job_company_name || '—'}\n${profile.job_company_size || '—'} employees\nFounded ${profile.job_company_founded || '—'}`}
					/>
					<Info title="Location" value={profile.location_name} />
					<Info title="Compensation (est.)" value={profile.inferred_salary} />
					<Info title="Languages" value={toList(profile.languages)[0]} />
					<Info title="Interests" value={toList(profile.interests)[0]} />
				</div>
				<h3>Skills</h3>
				<div className="tags">
					{toList(profile.skills)
						.slice(0, 15)
						.map((skill) => (
							<span key={skill}>{skill}</span>
						))}
				</div>
				<div className="infogrid">
					<Info title="Education" value={toList(profile.education)[0]} />
					<Info
						title="Certifications"
						value={toList(profile.certifications)[0]}
					/>
				</div>
				<h3>Previous experience</h3>
				<p>{toList(profile.experience)[0] || '—'}</p>
			</div>
			<div className="panelactions">
				<button className="primary">View full profile</button>
				{profile.linkedin_url && (
					<a href={`https://${profile.linkedin_url}`} target="_blank">
						LinkedIn ↗
					</a>
				)}
			</div>
		</aside>
	);
}
