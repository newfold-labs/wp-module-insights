import { __ } from '@wordpress/i18n';
import { ReactComponent as LighthouseEmptyStateIcon } from '../../../../assets/icons/empty-state-insights.svg';
import { Button, Spinner } from '@newfold/ui-component-library';
import { useTriggerScan } from '../../hooks/useTriggerScan';
import classnames from 'classnames';

const EmptyState = () => {
	const { triggerScan, isRunningScan, isTryingToRun } = useTriggerScan();

	return (
		<>
			<div className="nfd-flex nfd-flex-col nfd-items-center nfd-justify-center nfd-py-2 nfd-text-center nfd--mt-8">
				<LighthouseEmptyStateIcon className="nfd-w-[40%] nfd-min-w-[200px] nfd-max-w-[300px]"/>
				<h3 className="nfd-text-base nfd-font-medium nfd-text-gray-900 nfd-mb-1 nfd-mt-8">
					{
						isRunningScan ?
							__( 'Your report is being generated', 'wp-module-insights' ) :
							__( 'No insights yet.', 'wp-module-insights' )
					}
				</h3>
				<p className="nfd-mt-1 nfd-max-w-lg nfd-text-sm nfd-text-gray-700">
					{
						isRunningScan ?
							__( 'This usually takes a few minutes. You can refresh or come back later, results will show up once ready.', 'wp-module-insights' )
							:
							__( 'Run your first test to generate performance, accessibility, and SEO data.', 'wp-module-insights' )
					}
				</p>
			</div>
			<div className="nfd-flex nfd-justify-center nfd-mt-2 nfd-mb-4">
				<Button
					variant="primary"
					onClick={ triggerScan }
					disabled={ isTryingToRun || isRunningScan }
					className={ classnames(
						'nfd-flex nfd-items-center nfd-gap-2',
						{ 'nfd-pl-3': isTryingToRun }
					) }
				>
					{ isTryingToRun && <Spinner /> }
					{ __( 'Run Your First Test', 'wp-module-insights' ) }
				</Button>
			</div>
		</>
	);
};

export default EmptyState;

