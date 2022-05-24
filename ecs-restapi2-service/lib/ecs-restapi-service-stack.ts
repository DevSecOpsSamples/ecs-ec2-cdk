import * as cdk from 'aws-cdk-lib';
import { Stack, StackProps, CfnOutput, Duration } from 'aws-cdk-lib';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { ApplicationLoadBalancer, ApplicationProtocol, SslPolicy, CfnLoadBalancer } from 'aws-cdk-lib/aws-elasticloadbalancingv2';

import { CLUSTER_NAME } from '../../ecs-ec2-cluster/lib/cluster-config';
import { SSM_PREFIX } from '../../ssm-prefix';

import { Construct } from 'constructs';

/**
 * 
 */
export class EcsRestAPIServiceStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        const vpcId = this.node.tryGetContext('vpcId') || ssm.StringParameter.valueFromLookup(this, `${SSM_PREFIX}/vpc-id`);
        const vpc = ec2.Vpc.fromLookup(this, 'vpc', { vpcId });
        const clusterSgId = ssm.StringParameter.valueFromLookup(this, `${SSM_PREFIX}/cluster-securitygroup-id`);
        const ecsSecurityGroup = ec2.SecurityGroup.fromSecurityGroupId(this, 'ecs-security-group', clusterSgId);

        const cluster = ecs.Cluster.fromClusterAttributes(this, 'ecs-cluster', {
            clusterName: CLUSTER_NAME,
            vpc,
            securityGroups: [ecsSecurityGroup]
        });
        const serviceName = 'restapi2'
        const containerName = `${serviceName}-container`
        const applicationPort = 8080;

        const capacityProviderName = ssm.StringParameter.valueFromLookup(this, `${SSM_PREFIX}/cluster-capacityprovider-name`);
        const executionRoleArn = ssm.StringParameter.valueFromLookup(this, `${SSM_PREFIX}/task-execution-role-arn`);
        const taskRoleArn = ssm.StringParameter.valueFromLookup(this, `${SSM_PREFIX}/default-task-role-arn`);

        // Network mode: bridge (default)
        const taskDefinition = new ecs.TaskDefinition(this, 'task-definition', {
            compatibility: ecs.Compatibility.EC2,
            family: `${serviceName}-task`,
            executionRole: iam.Role.fromRoleArn(this, 'task-execution-role', cdk.Lazy.string({ produce: () => executionRoleArn })),
            taskRole: iam.Role.fromRoleArn(this, 'task-role', cdk.Lazy.string({ produce: () => taskRoleArn }))
        });
        const container = taskDefinition.addContainer('container-restapi', {
            // image: ecs.ContainerImage.fromRegistry("amazon/amazon-ecs-sample"),
            containerName,
            image: ecs.ContainerImage.fromRegistry("681747700094.dkr.ecr.ap-northeast-2.amazonaws.com/abp-sample-registry:latest"),
            cpu: 1024,
            memoryReservationMiB: 1024
        });
        container.addPortMappings({ containerPort: applicationPort, hostPort: 0 });

        const ecsService = new ecs.Ec2Service(this, 'ec2-service', {
            cluster,
            serviceName,
            taskDefinition,
            capacityProviderStrategies: [{
                capacityProvider: capacityProviderName,
                weight: 1
            }]
        });
        const scaling = ecsService.autoScaleTaskCount({
            minCapacity: 2,
            maxCapacity: 20,
        });
        scaling.scaleOnCpuUtilization('CpuScaling', {
            targetUtilizationPercent: 50,
            scaleInCooldown: Duration.seconds(60),
            scaleOutCooldown: Duration.seconds(60),
        });
        const logGroup = new logs.LogGroup(this, 'logGroup', {
            removalPolicy: cdk.RemovalPolicy.DESTROY,
            logGroupName: serviceName,
            retention: logs.RetentionDays.TWO_WEEKS,
        });

        const albSecurityGroupName = `albsg-${serviceName}`
        const albSecurityGroup = new ec2.SecurityGroup(this, albSecurityGroupName, {
            securityGroupName: albSecurityGroupName,
            vpc,
            allowAllOutbound: true,
            description: `ALB security group, service: ${serviceName}`
        });
        ecsSecurityGroup.addIngressRule(albSecurityGroup, ec2.Port.tcp(0), 'Allows all from ALB');

        const alb = new ApplicationLoadBalancer(this, 'alb', {
            securityGroup: albSecurityGroup,
            vpc,
            loadBalancerName: `alb-${serviceName}`,
            internetFacing: true,
            deletionProtection: false,
            idleTimeout: cdk.Duration.seconds(30),
        });

        const listener = alb.addListener('https-listener', {
            protocol: ApplicationProtocol.HTTP,
            open: false,
        });

        listener.addTargets('ec2-service-target', {
            targetGroupName: `tg-${serviceName}`,
            port: applicationPort,
            protocol: ApplicationProtocol.HTTP,
            targets: [ecsService.loadBalancerTarget({
                containerName: containerName,
                containerPort: applicationPort,
            })],
            healthCheck: {
                healthyThresholdCount: 2,
                unhealthyThresholdCount: 5,
                interval: Duration.seconds(12),
                path: '/ping',
                timeout: Duration.seconds(10),
            },
            deregistrationDelay: Duration.seconds(15)
        });
        (ecsService.node.defaultChild as ecs.CfnService).healthCheckGracePeriodSeconds = undefined;

        new CfnOutput(this, 'VPC', { value: vpc.vpcId });
        new CfnOutput(this, 'Cluster', { value: cluster.clusterName });
        new CfnOutput(this, 'Service', { value: ecsService.serviceArn });
        new CfnOutput(this, 'TaskDefinition', { value: taskDefinition.family });
        new CfnOutput(this, 'LogGroup', { value: logGroup.logGroupName });
        new CfnOutput(this, 'ALB', { value: alb.loadBalancerDnsName });
    }
}
