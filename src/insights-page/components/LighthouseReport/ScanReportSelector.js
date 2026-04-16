import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { useInsights } from '../../context/InsightsContext';
import {
	dropdownChevronClass,
	dropdownMenuButtonClass,
	insightsMenuItemClass,
	insightsMenuItemsClass,
} from '../common/insightsDropdownMenuClasses';

const formatScanOptionLabel = ( scan ) => {
	const when = new Date( scan.createdAt ).toLocaleString();
	const perf =
		scan.performanceScore != null
			? Math.round( scan.performanceScore * 100 )
			: '—';
	return `${ when } · ${ perf }`;
};

/** Wider panel + wrapped lines for long date/score labels. */
const scanReportMenuItemsClass = `${ insightsMenuItemsClass } nfd-min-w-[240px] nfd-max-w-[min(24rem,calc(100vw-1.5rem))]`;

const scanReportMenuItemClass = `${ insightsMenuItemClass } nfd-whitespace-normal nfd-break-words`;

const ScanReportSelector = () => {
	const {
		scansSorted,
		selectedReportJobId,
		setActiveReportJobId,
	} = useInsights();

	const selectedButtonLabel = useMemo( () => {
		if ( selectedReportJobId === null ) {
			return __( 'Latest scan', 'wp-module-insights' );
		}
		const scan = scansSorted.find(
			( s ) => String( s.jobId ) === String( selectedReportJobId )
		);
		return scan
			? formatScanOptionLabel( scan )
			: __( 'Latest scan', 'wp-module-insights' );
	}, [ selectedReportJobId, scansSorted ] );

	if ( ! scansSorted.length ) {
		return null;
	}

	return (
		<div className="nfd-flex nfd-flex-col nfd-items-stretch sm:nfd-items-end">
			<Menu
				as="div"
				className="nfd-relative nfd-inline-block nfd-w-full nfd-text-left sm:nfd-w-auto"
			>
				<MenuButton
					id="nfd-insights-scan-select"
					type="button"
					className={ `${ dropdownMenuButtonClass } nfd-w-full nfd-min-w-[240px] sm:nfd-w-auto` }
					aria-label={ __(
						'Select scan for Lighthouse Report',
						'wp-module-insights'
					) }
				>
					<span className="nfd-min-w-0 nfd-flex-1 nfd-text-left">
						{ selectedButtonLabel }
					</span>
					<ChevronDownIcon
						className={ dropdownChevronClass }
						aria-hidden="true"
					/>
				</MenuButton>
				<MenuItems
					anchor="bottom end"
					modal={ false }
					portal
					className={ scanReportMenuItemsClass }
				>
					<MenuItem
						as="button"
						type="button"
						className={ scanReportMenuItemClass }
						onClick={ () => setActiveReportJobId( null ) }
					>
						{ __( 'Latest scan', 'wp-module-insights' ) }
					</MenuItem>
					{ scansSorted.map( ( scan ) => (
						<MenuItem
							key={ scan.jobId }
							as="button"
							type="button"
							className={ scanReportMenuItemClass }
							onClick={ () =>
								setActiveReportJobId( String( scan.jobId ) )
							}
						>
							{ formatScanOptionLabel( scan ) }
						</MenuItem>
					) ) }
				</MenuItems>
			</Menu>
		</div>
	);
};

export default ScanReportSelector;
