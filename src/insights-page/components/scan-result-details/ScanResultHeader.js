import { __ } from '@wordpress/i18n';
import {
	ArrowTopRightOnSquareIcon,
	ClipboardDocumentIcon,
	ComputerDesktopIcon,
	DevicePhoneMobileIcon,
} from '@heroicons/react/24/outline';
import { useCallback, useState } from '@wordpress/element';

/**
 * @param {Object} props Props.
 * @param {string|null} props.backToInsightsUrl Back link href.
 * @param {string} props.displayUrl URL to show (final or requested).
 * @param {string} props.fetchTime ISO fetch time from Lighthouse.
 * @param {string} props.formFactor `mobile` | `desktop` | other.
 * @param {string} [props.lighthouseVersion] Optional version string.
 */
const ScanResultHeader = ( {
	backToInsightsUrl,
	displayUrl,
	fetchTime,
	formFactor,
	lighthouseVersion,
} ) => {
	const [ copied, setCopied ] = useState( false );

	const onCopyLink = useCallback( () => {
		const url = window.location.href;
		const done = () => {
			setCopied( true );
			window.setTimeout( () => setCopied( false ), 2000 );
		};
		if ( navigator.clipboard?.writeText ) {
			navigator.clipboard.writeText( url ).then( done ).catch( () => {
				done();
			} );
		} else {
			done();
		}
	}, [] );

	const ff = ( formFactor || '' ).toLowerCase();
	const isMobile = ff === 'mobile';
	const isDesktop = ff === 'desktop';

	return (
		<header className="nfd-mb-8">
			{ backToInsightsUrl && (
				<div className="nfd-mb-4">
					<a
						href={ backToInsightsUrl }
						className="nfd-inline-flex nfd-items-center nfd-gap-1 nfd-text-sm nfd-font-medium nfd-text-blue-700 nfd-no-underline hover:nfd-underline focus:nfd-outline-none focus:nfd-ring-2 focus:nfd-ring-blue-500 focus:nfd-ring-offset-2 nfd-rounded-sm"
					>
						{ __( '← Back to Site Insights', 'wp-module-insights' ) }
					</a>
				</div>
			) }

			<div className="nfd-flex nfd-flex-col nfd-gap-4 lg:nfd-flex-row lg:nfd-items-start lg:nfd-justify-between">
				<div className="nfd-min-w-0 nfd-flex-1">
					<h1 className="nfd-text-2xl nfd-font-bold nfd-tracking-tight nfd-text-gray-900">
						{ __( 'Performance report', 'wp-module-insights' ) }
					</h1>
					<p className="nfd-mt-2 nfd-max-w-3xl nfd-text-sm nfd-leading-relaxed nfd-text-gray-600">
						{ __(
							'Lighthouse audit for this scan. Expand each diagnostic for details and guidance.',
							'wp-module-insights'
						) }
					</p>
				</div>
				<div className="nfd-flex nfd-shrink-0 nfd-items-center nfd-gap-2">
					<button
						type="button"
						onClick={ onCopyLink }
						className="nfd-inline-flex nfd-items-center nfd-gap-1.5 nfd-rounded-md nfd-border nfd-border-gray-300 nfd-bg-white nfd-px-3 nfd-py-2 nfd-text-sm nfd-font-medium nfd-text-gray-800 nfd-shadow-sm hover:nfd-bg-gray-50 focus:nfd-outline-none focus:nfd-ring-2 focus:nfd-ring-blue-500 focus:nfd-ring-offset-2"
					>
						<ClipboardDocumentIcon className="nfd-h-4 nfd-w-4 nfd-text-gray-600" aria-hidden />
						{ copied
							? __( 'Copied', 'wp-module-insights' )
							: __( 'Copy link', 'wp-module-insights' ) }
					</button>
				</div>
			</div>

			<div className="nfd-mt-6 nfd-rounded-lg nfd-border nfd-border-gray-200 nfd-bg-gray-50 nfd-p-4">
				<div className="nfd-flex nfd-flex-wrap nfd-items-center nfd-gap-2 nfd-text-sm">
					<span className="nfd-font-medium nfd-text-gray-700">
						{ __( 'URL', 'wp-module-insights' ) }
					</span>
					{ displayUrl ? (
						<a
							href={ displayUrl }
							target="_blank"
							rel="noopener noreferrer"
							className="nfd-inline-flex nfd-min-w-0 nfd-max-w-full nfd-items-center nfd-gap-1 nfd-break-all nfd-text-blue-700 hover:nfd-underline"
						>
							<span className="nfd-truncate">{ displayUrl }</span>
							<ArrowTopRightOnSquareIcon className="nfd-h-4 nfd-w-4 nfd-shrink-0" aria-hidden />
						</a>
					) : (
						<span className="nfd-text-gray-500">{ __( '—', 'wp-module-insights' ) }</span>
					) }
				</div>

				<div className="nfd-mt-3 nfd-flex nfd-flex-wrap nfd-items-center nfd-gap-x-6 nfd-gap-y-2 nfd-text-xs nfd-text-gray-600">
					{ fetchTime && (
						<span>
							{ __( 'Report time:', 'wp-module-insights' ) }{ ' ' }
							<time dateTime={ fetchTime }>
								{ new Date( fetchTime ).toLocaleString() }
							</time>
						</span>
					) }
					{ ( isMobile || isDesktop ) && (
						<span className="nfd-inline-flex nfd-items-center nfd-gap-1.5">
							{ isMobile ? (
								<>
									<DevicePhoneMobileIcon className="nfd-h-4 nfd-w-4" aria-hidden />
									{ __( 'Mobile', 'wp-module-insights' ) }
								</>
							) : (
								<>
									<ComputerDesktopIcon className="nfd-h-4 nfd-w-4" aria-hidden />
									{ __( 'Desktop', 'wp-module-insights' ) }
								</>
							) }
						</span>
					) }
					{ lighthouseVersion && (
						<span>
							{ __( 'Lighthouse', 'wp-module-insights' ) } { lighthouseVersion }
						</span>
					) }
				</div>
			</div>
		</header>
	);
};

export default ScanResultHeader;
