find . -name "cdk.context.json" -exec rm -f {} \;

echo "destroy ecs-restapi-service"

cd ecs-restapi-service
cdk destroy


echo "destroy ecs-ec2-cluster"
cd ../ecs-ec2-cluster
cdk destroy


echo "destroy ecs-iam-role"
cd ../ecs-iam-role
cdk destroy


echo "destroy vpc"
cd ../vpc
cdk destroy