import { Stack, StackProps, CfnOutput, Token, Fn } from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import { CfnLaunchConfiguration } from 'aws-cdk-lib/aws-autoscaling';
import { Construct } from 'constructs';

import { CLUSTER_NAME } from '../lib/cluster-config';
import { SSM_PREFIX } from '../../ssm-prefix';


/**
 * Prerequisites:
 *   EC2 key pair (naming: dev-ecs-ec2-cluster)
 */
export class EcsEc2ClusterStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        const vpcId = this.node.tryGetContext('vpcId') || ssm.StringParameter.valueFromLookup(this, `${SSM_PREFIX}/vpc-id`);
        const vpc = ec2.Vpc.fromLookup(this, 'vpc', { vpcId });

        const cluster = new ecs.Cluster(this, 'cluster', {
            vpc,
            clusterName: CLUSTER_NAME,
            containerInsights: true,
        });
        const privateSubnetsSelection = { subnets: vpc.privateSubnets };

        const keyPairName = 'dev-ecs-ec2-cluster'
        const asg = cluster.addCapacity('ec2-instance', {
            instanceType: new ec2.InstanceType('g4dn.xlarge'),
            minCapacity: 1,
            maxCapacity: 10,
            keyName: keyPairName,
            vpcSubnets: privateSubnetsSelection
        });

        const cfnLaunchConfig = asg.node.findChild('LaunchConfig') as CfnLaunchConfiguration;
        const ecsEc2SgToken = Token.asAny(Fn.select(0, cfnLaunchConfig.securityGroups as Array<any>));
        new CfnOutput(this, 'VPC', { value: vpc.vpcId });
        new CfnOutput(this, 'EC2 Security Group ID', { value: ecsEc2SgToken.toString() });
        new CfnOutput(this, 'Cluster', { value: cluster.clusterName });

        new ssm.StringParameter(this, 'ssm-cluster-securitygroup-id', { parameterName: `${SSM_PREFIX}/cluster-securitygroup-id`, stringValue: ecsEc2SgToken.toString() });
    }
}
