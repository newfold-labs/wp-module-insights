import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import ScanDiagnostic from './ScanDiagnostics';
import { Spinner } from '@newfold/ui-component-library';
import { useInsights } from '../context/InsightsContext';

const Heading = ( { details } ) => {
	return <>
		<div className="nfd-flex nfd-justify-between nfd-items-center nfd-border-b nfd-border-gray-100">
			<h1 className="nfd-text-2xl nfd-font-bold nfd-text-gray-900">
				{ __( 'Scan Result Details', 'wp-module-insights' ) }
			</h1>
			{
				details &&
				<div className="nfd-text-sm nfd-text-gray-500">
					{ details?.fetchTime && new Date( details.fetchTime ).toLocaleString() }
				</div>
			}
		</div>
		<div className="nfd-mb-8">
			<p className="nfd-text-gray-600">
				{ __( 'Below is a detailed breakdown of the issues found during the scan. Expand each item to see more details and recommendations for improvement.', 'wp-module-insights' ) }
			</p>
		</div>
	</>

}

const ScanResultDetailsPage = ( { scanId } ) => {
	const { loading: isLoadingScans, scans } = useInsights();
	const [ details, setDetails ] = useState( null );
	const [ loading, setLoading ] = useState( true );
	const [ scan, setScan ] = useState( null );

	const fetchDetails = async () => {
		if ( ! scan || ! scan?.resultUrl ) {
			setLoading(false);
			return;
		}

		setLoading( true );
		try {
			const response = await fetch( scan.resultUrl );

			if ( ! response.ok ) {
				throw new Error( `HTTP ${ response.status }` );
			}

			const json = await response.json();
			setDetails( json );
		} catch ( error ) {
			console.error( 'Error fetching details:', error );
		} finally {
			setLoading( false );
		}
	};

	useEffect( () => {
		if ( scans && scans.length ) {
			const foundScan = scans.find( ( s ) => +s?.jobId === +scanId );
			setScan( foundScan || null );
		}
	}, [ isLoadingScans, scans ] );

	useEffect( () => {
		fetchDetails();
	}, [ scan ] );

	const audits = ! details ? [] : Object.keys( details?.audits || {} )
		.filter( auditKey => {
			const audit = details.audits[ auditKey ];
			return audit.score !== null && audit.score < 1;
		} )
		.map( key => details.audits[ key ] );

	if ( loading || isLoadingScans ) {
		return (
			<div className="nfd-max-w-[900px] nfd-mx-auto nfd-mt-[3rem]">
				<Heading/>
				<Spinner/>
			</div>
		);
	}

	return (
		<div className="nfd-max-w-[900px] nfd-mx-auto nfd-mt-[3rem]">
			<Heading details={ details }/>
			<ScanDiagnostic audits={ audits }/>
		</div>
	);
};

export default ScanResultDetailsPage;
