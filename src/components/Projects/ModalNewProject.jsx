import { useEffect, useRef, useState } from 'react';
import { addDoc, collection, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { getCurrentUser } from '../../services/auth';
import { slugify } from '../../utils/slugify';
import { uploadProjectCover } from '../../services/storage';
import '../../style/Modal.css';
import '../../style/Forms.css';

export default function ModalNewProject({ onClose }) {
	const fileInputRef = useRef(null);
	const [coverFile, setCoverFile] = useState(null);
	const [coverPreviewUrl, setCoverPreviewUrl] = useState('');

	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const [formData, setFormData] = useState({
		title: '',
		description: '',
	});

	function handleChange(e) {
		if (error) setError('');
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));

		if (e.target.tagName === 'TEXTAREA') {
			e.target.style.height = 'auto';
			e.target.style.height = e.target.scrollHeight + 'px';
		}
	}

	function openFilePicker() {
		fileInputRef.current?.click();
	}

	function handleCoverChange(e) {
		if (error) setError('');
		const file = e.target.files?.[0] || null;
		// permite escolher o mesmo arquivo novamente
		e.target.value = '';
		setCoverFile(file);
	}

	useEffect(() => {
		if (!coverFile) {
			setCoverPreviewUrl('');
			return;
		}
		const url = URL.createObjectURL(coverFile);
		setCoverPreviewUrl(url);
		return () => URL.revokeObjectURL(url);
	}, [coverFile]);

	async function handleSubmit(e) {
		e.preventDefault();
		if (loading) return;
		setError('');

		const name = String(formData.title || '').trim();
		const description = String(formData.description || '').trim();
		const slug = slugify(name);
		if (!name) {
			setError('Informe um título.');
			return;
		}

		const user = getCurrentUser();
		if (!user) {
			setError('Você precisa estar logado para criar um projeto.');
			return;
		}

		const createdByValue = user?.displayName || user?.email || '';
		// ownerEmail é a fonte de verdade para permissões (e-mail do criador)
		const ownerEmailValue = user?.email || '';
		const members = user?.email ? [user.email] : [];

		setLoading(true);
		try {
			const docRef = await addDoc(collection(db, 'projects'), {
				name,
				slug,
				description,
				members,
				createdAt: serverTimestamp(),
				createdBy: createdByValue,
				ownerEmail: ownerEmailValue,
			});

			// Upload opcional da capa
			if (coverFile) {
				try {
					const { url, fullPath } = await uploadProjectCover({ projectId: docRef.id, file: coverFile });
					await updateDoc(docRef, {
						coverUrl: url,
						coverPath: fullPath,
						updatedAt: serverTimestamp(),
					});
				} catch (uploadErr) {
					console.error('Erro ao enviar capa:', uploadErr);
					// Não impede a criação do projeto; apenas informa.
					setError(uploadErr?.message || 'Projeto criado, mas falhou ao enviar a capa.');
					setLoading(false);
					return;
				}
			}

			onClose?.();
		} catch (err) {
			console.error('Erro ao criar projeto:', err);
			setError(err?.message || 'Não foi possível criar o projeto.');
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className="modal-overlay">
			<div className="modal-details-wrap" onClick={(e) => e.stopPropagation()}>
				<form className="modal-details-card modal-project-card" onSubmit={handleSubmit}>

					{/* TOPO BRANCO */}
					<div className="modal-project-cover">
						<button
							type="button"
							className="modal-details-closeBtn modal-project-closeBtn"
							onClick={onClose}
							aria-label="Fechar"
							title="Fechar"
						>
							<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
								<path d="M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
								<path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
							</svg>
						</button>
						{coverPreviewUrl ? (
							<img className="modal-project-coverPreview" src={coverPreviewUrl} alt="" />
						) : null}
						<button
							type="button"
							className="modal-project-upload"
							onClick={openFilePicker}
						>
							<span className="modal-project-uploadLeft" aria-hidden="true">
								<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
									<path d="M4 5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5Z" stroke="white" strokeWidth="2" />
									<path d="M8 14l2.5-2.5L13 14l3-3 4 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
									<path d="M9 9h.01" stroke="white" strokeWidth="3" strokeLinecap="round" />
								</svg>
							</span>
							<span className="modal-project-uploadText">{coverFile?.name ? coverFile.name : 'Realize upload de uma capa'}</span>
							<span className="modal-project-uploadRight" aria-hidden="true">
								<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
									<path d="M12 3v10" stroke="white" strokeWidth="2" strokeLinecap="round" />
									<path d="M8 7l4-4 4 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
									<path d="M4 14v5a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5" stroke="white" strokeWidth="2" strokeLinecap="round" />
								</svg>
							</span>
						</button>

						<input
							ref={fileInputRef}
							type="file"
							accept="image/*"
							style={{ display: 'none' }}
							onChange={handleCoverChange}
						/>
					</div>

					{/* FORM */}
					<div className="modal-project-content">
						<div className="modal-project-field">
							<div className="modal-project-label">Título</div>
							<input
								className="task-input"
								type="text"
								name="title"
								value={formData.title}
								onChange={handleChange}
								required
							/>
						</div>

						<div className="modal-project-field">
							<div className="modal-project-label">Descrição</div>
							<textarea
								className="task-input modal-project-description"
								name="description"
								value={formData.description}
								onChange={handleChange}
							/>
						</div>

						<div className="button-group">
							{error ? <div className="modal-project-error">{error}</div> : null}
							<button type="button" className="button-cancel" onClick={onClose}>
								Cancelar
							</button>
							<button type="submit" className="button-confirm" disabled={loading}>
								{loading ? 'Salvando...' : 'Confirmar'}
							</button>
						</div>
					</div>

				</form>
			</div>
		</div>
	);
}
