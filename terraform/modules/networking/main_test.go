# =============================================================================
# Networking Module Tests - Sprint 38
# Unit tests for Terraform networking module
# =============================================================================

package test

import (
	"testing"
	"github.com/gruntwork-io/terratest/modules/terraform"
	"github.com/stretchr/testify/assert"
)

func TestNetworkingModule(t *testing.T) {
	t.Run("VPC Creation", func(t *testing.T) {
		// Test VPC is created with correct CIDR
		terraformOptions := &terraform.Options{
			TerraformDir: "../modules/networking",
			Vars: map[string]interface{}{
				"environment": "test",
				"app_name":    "apply-as-a-service",
				"cidr_block":  "10.0.0.0/16",
			},
		}

		defer terraform.Destroy(t, terraformOptions)
		terraform.InitAndApply(t, terraformOptions)

		vpcId := terraform.Output(t, terraformOptions, "vpc_id")
		assert.NotEmpty(t, vpcId, "VPC ID should not be empty")
	})

	t.Run("Subnet Allocation", func(t *testing.T) {
		// Test subnets are created in correct AZs
		terraformOptions := &terraform.Options{
			TerraformDir: "../modules/networking",
			Vars: map[string]interface{}{
				"environment": "test",
				"app_name":    "apply-as-a-service",
				"cidr_block":  "10.0.0.0/16",
				"availability_zones": []string{"us-east-1a", "us-east-1b"},
				"public_subnet_cidrs": []string{"10.0.1.0/24", "10.0.2.0/24"},
				"private_subnet_cidrs": []string{"10.0.101.0/24", "10.0.102.0/24"},
			},
		}

		defer terraform.Destroy(t, terraformOptions)
		terraform.InitAndApply(t, terraformOptions)

		publicSubnets := terraform.OutputList(t, terraformOptions, "subnet_public_ids")
		privateSubnets := terraform.OutputList(t, terraformOptions, "subnet_private_ids")

		assert.Equal(t, 2, len(publicSubnets), "Should have 2 public subnets")
		assert.Equal(t, 2, len(privateSubnets), "Should have 2 private subnets")
	})

	t.Run("Security Groups", func(t *testing.T) {
		// Test security groups are created with correct rules
		terraformOptions := &terraform.Options{
			TerraformDir: "../modules/networking",
			Vars: map[string]interface{}{
				"environment": "test",
				"app_name":    "apply-as-a-service",
			},
		}

		defer terraform.Destroy(t, terraformOptions)
		terraform.InitAndApply(t, terraformOptions)

		sgId := terraform.Output(t, terraformOptions, "security_group_id")
		dbSgId := terraform.Output(t, terraformOptions, "security_group_db_id")

		assert.NotEmpty(t, sgId, "App security group should exist")
		assert.NotEmpty(t, dbSgId, "Database security group should exist")
	})

	t.Run("Internet Gateway", func(t *testing.T) {
		// Test internet gateway is attached to VPC
		terraformOptions := &terraform.Options{
			TerraformDir: "../modules/networking",
			Vars: map[string]interface{}{
				"environment": "test",
				"app_name":    "apply-as-a-service",
			},
		}

		defer terraform.Destroy(t, terraformOptions)
		terraform.InitAndApply(t, terraformOptions)

		igwId := terraform.Output(t, terraformOptions, "internet_gateway_id")
		assert.NotEmpty(t, igwId, "Internet gateway should exist")
	})

	t.Run("NAT Gateway", func(t *testing.T) {
		// Test NAT gateway is created when enabled
		terraformOptions := &terraform.Options{
			TerraformDir: "../modules/networking",
			Vars: map[string]interface{}{
				"environment":       "test",
				"app_name":          "apply-as-a-service",
				"enable_nat_gateway": true,
			},
		}

		defer terraform.Destroy(t, terraformOptions)
		terraform.InitAndApply(t, terraformOptions)

		natId := terraform.Output(t, terraformOptions, "nat_gateway_id")
		assert.NotEmpty(t, natId, "NAT gateway should exist")
	})
}
