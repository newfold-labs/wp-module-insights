import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Select } from '@newfold/ui-component-library';
import { useInsights } from '../../context/InsightsContext';
import { getScanJobId } from '../../../utils';

const formatScanOptionLabel = ( scan ) => {
	const when = new Date( scan.createdAt ).toLocaleString();
	const perf =
		scan.performanceScore != null
			? Math.round( scan.performanceScore * 100 )
			: '—';
	return `${ when } · ${ perf }`;
};

const ScanReportSelector = () => {
	const {
		scansSorted,
		selectedReportJobId,
		setActiveReportJobId,
	} = useInsights();

	const scanOptions = useMemo(
		() => [
			{
				value: 'latest',
				label: __( 'Latest scan', 'wp-module-insights' ),
			},
			...scansSorted.map( ( scan ) => ( {
				value: String( getScanJobId( scan ) ?? '' ),
				label: formatScanOptionLabel( scan ),
			} ) ),
		],
		[ scansSorted ]
	);

	const selectValue = useMemo( () => {
		if ( selectedReportJobId === null ) {
			return 'latest';
		}
		const id = String( selectedReportJobId );
		return scansSorted.some(
			( s ) => String( getScanJobId( s ) ?? '' ) === id
		)
			? id
			: 'latest';
	}, [ selectedReportJobId, scansSorted ] );

	const selectedButtonLabel = useMemo( () => {
		if ( selectedReportJobId === null ) {
			return __( 'Latest scan', 'wp-module-insights' );
		}
		const scan = scansSorted.find(
			( s ) => String( getScanJobId( s ) ?? '' ) === String( selectedReportJobId )
		);
		return scan
			? formatScanOptionLabel( scan )
			: __( 'Latest scan', 'wp-module-insights' );
	}, [ selectedReportJobId, scansSorted ] );

	const handleChange = ( value ) => {
		if ( value === 'latest' ) {
			setActiveReportJobId( null );
		} else {
			setActiveReportJobId( String( value ) );
		}
	};

	if ( ! scansSorted.length ) {
		return null;
	}

	return (
		<div className="nfd-flex nfd-flex-col nfd-items-stretch sm:nfd-items-end">
			<Select
				id="nfd-insights-scan-select"
				className="nfd-insights-neutral-select nfd-insights-neutral-select--scan-report nfd-relative nfd-inline-block nfd-w-full nfd-text-left sm:nfd-w-auto"
				value={ selectValue }
				options={ scanOptions }
				onChange={ handleChange }
				selectedLabel={ selectedButtonLabel }
				buttonProps={ {
					'aria-label': __(
						'Select scan for Lighthouse Report',
						'wp-module-insights'
					),
				} }
			/>
		</div>
	);
};

export default ScanReportSelector;
