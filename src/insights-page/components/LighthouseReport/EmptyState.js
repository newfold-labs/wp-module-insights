import { __ } from '@wordpress/i18n';
import { ReactComponent as LighthouseEmptyStateIcon } from '../../../../assets/icons/empty-state-insights.svg';
import { Button, Spinner } from '@newfold/ui-component-library';
import { useTriggerScan, useTriggetScans } from '../../hooks/useTriggerScan';
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
				<p className="nfd-text-sm nfd-text-gray-500 nfd-max-w-lg nfd-mt-1">
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
					onClick={ triggerScan }
					className={ classnames(
						'nfd-flex nfd-items-center nfd-gap-2 nfd-px-6 nfd-py-3 nfd-border-0 nfd-bg-gray-900 nfd-text-white nfd-text-sm nfd-font-medium nfd-rounded-md',
						{
							'nfd-opacity-50': isTryingToRun || isRunningScan,
							'nfd-cursor-pointer hover:nfd-bg-gray-800 focus:nfd-outline-none focus:nfd-ring-2 focus:nfd-ring-offset-2 focus:nfd-ring-gray-900': ! (isTryingToRun || isRunningScan),
							'nfd-pl-3 nfd-cursor-progress': isTryingToRun,
							'nfd-cursor-not-allowed': isRunningScan,
						}
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

